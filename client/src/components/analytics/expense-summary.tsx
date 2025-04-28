import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseSummaryProps {
  expenses: Expense[];
  isLoading: boolean;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentageOfTotal: number;
  trend: 'up' | 'down' | 'stable';
}

interface TimePeriodSummary {
  total: number;
  average: number;
  highest: number;
  lowest: number;
}

export default function ExpenseSummary({ expenses, isLoading }: ExpenseSummaryProps) {
  const summary = useMemo(() => {
    if (!expenses.length) return null;

    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate date ranges
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = {
          total: 0,
          count: 0,
          recentTotal: 0 // Last 30 days
        };
      }
      acc[exp.category].total += exp.amount;
      acc[exp.category].count += 1;
      if (new Date(exp.date) >= oneMonthAgo) {
        acc[exp.category].recentTotal += exp.amount;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number; recentTotal: number }>);

    // Calculate category summaries
    const totalSpent = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);
    const categories: CategorySummary[] = Object.entries(categoryTotals)
      .map(([category, data]) => {
        const monthlyAverage = data.total / 12; // Simplified monthly average
        const trend: 'up' | 'down' | 'stable' = 
          data.recentTotal > monthlyAverage * 1.1 ? 'up' :
          data.recentTotal < monthlyAverage * 0.9 ? 'down' : 'stable';

        return {
          category,
          total: data.total,
          count: data.count,
          percentageOfTotal: (data.total / totalSpent) * 100,
          trend
        };
      })
      .sort((a, b) => b.total - a.total);

    // Calculate time period summaries
    const calculatePeriodSummary = (startDate: Date): TimePeriodSummary => {
      const periodExpenses = expenses.filter(exp => new Date(exp.date) >= startDate);
      if (!periodExpenses.length) {
        return {
          total: 0,
          average: 0,
          highest: 0,
          lowest: 0
        };
      }

      const total = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const dayAmounts = periodExpenses.reduce((acc, exp) => {
        const date = exp.date.split('T')[0];
        acc[date] = (acc[date] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const dayValues = Object.values(dayAmounts);
      
      return {
        total,
        average: total / dayValues.length,
        highest: Math.max(...dayValues),
        lowest: Math.min(...dayValues)
      };
    };

    return {
      categories: categories.slice(0, 5), // Top 5 categories
      monthly: calculatePeriodSummary(oneMonthAgo),
      weekly: calculatePeriodSummary(oneWeekAgo),
      daily: calculatePeriodSummary(new Date(now.setHours(0, 0, 0, 0)))
    };
  }, [expenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No expense data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>

          {/* Monthly View */}
          <TabsContent value="monthly" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <h2 className="text-2xl font-bold">{formatCurrency(summary.monthly.total)}</h2>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                      <h2 className="text-2xl font-bold">{formatCurrency(summary.monthly.average)}</h2>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Weekly View */}
          <TabsContent value="weekly" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <h2 className="text-2xl font-bold">{formatCurrency(summary.weekly.total)}</h2>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                      <h2 className="text-2xl font-bold">{formatCurrency(summary.weekly.average)}</h2>
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Daily View */}
          <TabsContent value="daily" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <h2 className="text-2xl font-bold">{formatCurrency(summary.daily.total)}</h2>
                    </div>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Top Categories */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-4">Top Spending Categories</h3>
          <div className="space-y-4">
            {summary.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {category.count} transactions
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(category.total)}</div>
                  <div className="flex items-center gap-1 text-sm">
                    {category.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : category.trend === 'down' ? (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    ) : null}
                    <span className={category.trend === 'up' ? 'text-red-500' : 'text-green-500'}>
                      {Math.round(category.percentageOfTotal)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}