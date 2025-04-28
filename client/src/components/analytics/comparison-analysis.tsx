import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, subMonths, subYears, startOfMonth, endOfMonth } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface ComparisonAnalysisProps {
  expenses: Expense[];
  isLoading: boolean;
}

interface PeriodComparison {
  category: string;
  currentPeriod: number;
  previousPeriod: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

export default function ComparisonAnalysis({ expenses, isLoading }: ComparisonAnalysisProps) {
  const comparisons = useMemo(() => {
    if (!expenses.length) return null;

    const calculatePeriodTotals = (startDate: Date, endDate: Date) => {
      return expenses.reduce((acc, expense) => {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= startDate && expenseDate <= endDate) {
          if (!acc[expense.category]) {
            acc[expense.category] = 0;
          }
          acc[expense.category] += expense.amount;
        }
        return acc;
      }, {} as Record<string, number>);
    };

    const calculateComparison = (
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      previousPeriodStart: Date,
      previousPeriodEnd: Date
    ): PeriodComparison[] => {
      const currentTotals = calculatePeriodTotals(currentPeriodStart, currentPeriodEnd);
      const previousTotals = calculatePeriodTotals(previousPeriodStart, previousPeriodEnd);

      // Get all unique categories
      const categories = new Set([
        ...Object.keys(currentTotals),
        ...Object.keys(previousTotals)
      ]);

      return Array.from(categories).map(category => {
        const currentAmount = currentTotals[category] || 0;
        const previousAmount = previousTotals[category] || 0;
        const percentageChange = previousAmount === 0
          ? 100
          : ((currentAmount - previousAmount) / previousAmount) * 100;

        let trend: 'up' | 'down' | 'stable';
        if (Math.abs(percentageChange) < 5) {
          trend = 'stable';
        } else {
          trend = percentageChange > 0 ? 'up' : 'down';
        }

        return {
          category,
          currentPeriod: currentAmount,
          previousPeriod: previousAmount,
          percentageChange,
          trend
        };
      }).sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
    };

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const lastYearStart = startOfMonth(subYears(now, 1));
    const lastYearEnd = endOfMonth(subYears(now, 1));

    return {
      monthOverMonth: calculateComparison(
        currentMonthStart,
        currentMonthEnd,
        lastMonthStart,
        lastMonthEnd
      ),
      yearOverYear: calculateComparison(
        currentMonthStart,
        currentMonthEnd,
        lastYearStart,
        lastYearEnd
      )
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      case 'stable':
        return 'text-yellow-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparison Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparisons) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparison Analysis</CardTitle>
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
        <CardTitle>Comparison Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mom" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mom">Month over Month</TabsTrigger>
            <TabsTrigger value="yoy">Year over Year</TabsTrigger>
          </TabsList>

          <TabsContent value="mom">
            <div className="space-y-4">
              {comparisons.monthOverMonth.map((comparison, index) => (
                <div key={index} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{comparison.category}</h3>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(comparison.trend)}
                      <span className={`font-medium ${getTrendColor(comparison.trend)}`}>
                        {comparison.percentageChange > 0 ? '+' : ''}
                        {Math.round(comparison.percentageChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Current Month</div>
                      <div className="font-medium">{formatCurrency(comparison.currentPeriod)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Previous Month</div>
                      <div className="font-medium">{formatCurrency(comparison.previousPeriod)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yoy">
            <div className="space-y-4">
              {comparisons.yearOverYear.map((comparison, index) => (
                <div key={index} className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{comparison.category}</h3>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(comparison.trend)}
                      <span className={`font-medium ${getTrendColor(comparison.trend)}`}>
                        {comparison.percentageChange > 0 ? '+' : ''}
                        {Math.round(comparison.percentageChange)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Current Month</div>
                      <div className="font-medium">{formatCurrency(comparison.currentPeriod)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Year</div>
                      <div className="font-medium">{formatCurrency(comparison.previousPeriod)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}