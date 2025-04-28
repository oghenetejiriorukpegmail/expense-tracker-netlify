import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { expenses } from '../../shared/schema.js';
import { and, eq, gte, lte } from 'drizzle-orm';

export async function getAggregatedExpenses(
  db: PostgresJsDatabase,
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const result = await db
    .select({
      category: expenses.type,
      total: sql<string>`sum(cast(${expenses.cost} as decimal))`,
      count: sql<number>`count(*)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    )
    .groupBy(expenses.type);

  return result.map(row => ({
    category: row.category,
    total: parseFloat(row.total || '0'),
    count: row.count
  }));
}

export async function getCategoryTrends(
  db: PostgresJsDatabase,
  userId: number,
  category: string,
  startDate: Date,
  endDate: Date
) {
  // Get daily totals for the category
  const dailyTotals = await db
    .select({
      date: expenses.date,
      amount: sql<string>`sum(cast(${expenses.cost} as decimal))`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.type, category),
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    )
    .groupBy(expenses.date)
    .orderBy(expenses.date);

  // Calculate statistics
  const amounts = dailyTotals.map(day => parseFloat(day.amount || '0'));
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const count = amounts.length;
  const mean = total / count;
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median = count % 2 === 0
    ? (sortedAmounts[count / 2 - 1] + sortedAmounts[count / 2]) / 2
    : sortedAmounts[Math.floor(count / 2)];
  
  // Calculate standard deviation
  const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / count;
  const stdDev = Math.sqrt(variance);

  // Calculate 7-day moving average
  const trend = dailyTotals.map((day, index) => {
    const startIdx = Math.max(0, index - 6);
    const subset = dailyTotals.slice(startIdx, index + 1);
    const sum = subset.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
    return {
      date: day.date,
      amount: parseFloat(day.amount || '0'),
      movingAverage: sum / subset.length
    };
  });

  return {
    stats: {
      count,
      total,
      mean,
      median,
      stdDev,
      min: sortedAmounts[0],
      max: sortedAmounts[sortedAmounts.length - 1]
    },
    trend
  };
}

export async function getExpenseStatistics(
  db: PostgresJsDatabase,
  userId: number,
  startDate: Date,
  endDate: Date
) {
  // Get all expenses for the period
  const allExpenses = await db
    .select({
      type: expenses.type,
      cost: expenses.cost,
      date: expenses.date
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );

  // Convert costs to numbers
  const expensesWithNumericCost = allExpenses.map(exp => ({
    ...exp,
    cost: parseFloat(exp.cost)
  }));

  // Calculate overall statistics
  const calculateStats = (amounts: number[]) => {
    if (amounts.length === 0) {
      return {
        count: 0,
        total: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
        min: 0,
        max: 0
      };
    }

    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const count = amounts.length;
    const mean = total / count;
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const median = count % 2 === 0
      ? (sortedAmounts[count / 2 - 1] + sortedAmounts[count / 2]) / 2
      : sortedAmounts[Math.floor(count / 2)];
    
    const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / count;
    const stdDev = Math.sqrt(variance);

    return {
      count,
      total,
      mean,
      median,
      stdDev,
      min: sortedAmounts[0],
      max: sortedAmounts[sortedAmounts.length - 1]
    };
  };

  // Calculate overall statistics
  const allAmounts = expensesWithNumericCost.map(exp => exp.cost);
  const overall = calculateStats(allAmounts);

  // Calculate statistics by category
  const byCategory = expensesWithNumericCost.reduce((acc, exp) => {
    if (!acc[exp.type]) {
      acc[exp.type] = [];
    }
    acc[exp.type].push(exp.cost);
    return acc;
  }, {} as Record<string, number[]>);

  const categoryStats = Object.entries(byCategory).reduce((acc, [category, amounts]) => {
    acc[category] = calculateStats(amounts);
    return acc;
  }, {} as Record<string, ReturnType<typeof calculateStats>>);

  // Detect anomalies (expenses more than 2 standard deviations from the category mean)
  const anomalies = expensesWithNumericCost
    .filter(exp => {
      const stats = categoryStats[exp.type];
      return Math.abs(exp.cost - stats.mean) > stats.stdDev * 2;
    })
    .map(exp => ({
      date: exp.date,
      category: exp.type,
      amount: exp.cost
    }));

  return {
    overall,
    byCategory: categoryStats,
    anomalies
  };
}