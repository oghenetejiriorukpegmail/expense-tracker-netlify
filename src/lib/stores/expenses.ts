import { writable, derived } from 'svelte/store';
import type { Expense, DashboardStats } from '$lib/types';
import { CHART_COLORS } from '$lib/types';
import type { ChartData } from 'chart.js';

function createExpenseStore() {
  const { subscribe, set, update } = writable<Expense[]>([]);

  function add(expense: Expense) {
    update(expenses => [...expenses, expense]);
  }

  function remove(id: string) {
    update(expenses => expenses.filter(e => e.id !== id));
  }

  function updateExpense(id: string, updatedExpense: Partial<Expense>) {
    update(expenses => expenses.map(e => e.id === id ? { ...e, ...updatedExpense } : e));
  }

  function reset() {
    set([]);
  }

  return {
    subscribe,
    add,
    remove,
    update: updateExpense,
    reset,
    set
  };
}

export const expenses = createExpenseStore();

// Derived store for dashboard statistics
export const dashboardStats = derived<typeof expenses, DashboardStats>(
  expenses,
  $expenses => {
    const totalExpenses = $expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthlyAverage = totalExpenses / ($expenses.length || 1);

    // Calculate expenses by category
    const expensesByCategory = $expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly trends
    const monthlyTrends = $expenses
      .reduce((acc, exp) => {
        const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
        const existingMonth = acc.find(m => m.month === month);
        if (existingMonth) {
          existingMonth.amount += exp.amount;
        } else {
          acc.push({ month, amount: exp.amount });
        }
        return acc;
      }, [] as Array<{ month: string; amount: number }>)
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

    return {
      totalExpenses,
      monthlyAverage,
      expensesByCategory,
      monthlyTrends
    };
  }
);

interface ChartDataStore {
  monthly: ChartData;
  category: ChartData;
}

// Derived store for chart data
export const chartData = derived<[typeof expenses, typeof dashboardStats], ChartDataStore>(
  [expenses, dashboardStats],
  ([$expenses, $stats]) => ({
    monthly: {
      labels: $stats.monthlyTrends.map(t => t.month),
      datasets: [{
        label: 'Monthly Expenses',
        data: $stats.monthlyTrends.map(t => t.amount),
        backgroundColor: CHART_COLORS.primary,
        borderColor: CHART_COLORS.primary,
        borderWidth: 1
      }]
    },
    category: {
      labels: Object.keys($stats.expensesByCategory),
      datasets: [{
        label: 'Expenses by Category',
        data: Object.values($stats.expensesByCategory),
        backgroundColor: Object.keys($stats.expensesByCategory).map((_, i) => 
          Object.values(CHART_COLORS)[i % Object.keys(CHART_COLORS).length]
        )
      }]
    }
  })
);