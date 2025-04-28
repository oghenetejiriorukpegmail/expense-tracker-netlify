import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface Budget {
  category: string;
  amount: number;
}

interface BudgetProgressProps {
  expenses: Expense[];
  budgets: Budget[];
  isLoading: boolean;
}

type BudgetStatus = 'under' | 'near' | 'over';

interface CategoryProgress {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  status: BudgetStatus;
}

interface OverallProgress {
  spent: number;
  budget: number;
  percentage: number;
  status: BudgetStatus;
}

interface BudgetProgressData {
  categories: CategoryProgress[];
  overall: OverallProgress;
}

export default function BudgetProgress({ expenses, budgets, isLoading }: BudgetProgressProps) {
  const progress = useMemo<BudgetProgressData | null>(() => {
    if (!expenses.length || !budgets.length) return null;

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate progress for each budget category
    const categoryProgress: CategoryProgress[] = budgets.map(budget => {
      const spent = categoryTotals[budget.category] || 0;
      const percentage = (spent / budget.amount) * 100;
      
      let status: BudgetStatus;
      if (percentage >= 100) {
        status = 'over';
      } else if (percentage >= 80) {
        status = 'near';
      } else {
        status = 'under';
      }

      return {
        category: budget.category,
        spent,
        budget: budget.amount,
        percentage,
        status
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // Calculate overall budget progress
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const overallPercentage = (totalSpent / totalBudget) * 100;

    const overallStatus: BudgetStatus = overallPercentage >= 100 ? 'over' : overallPercentage >= 80 ? 'near' : 'under';

    return {
      categories: categoryProgress,
      overall: {
        spent: totalSpent,
        budget: totalBudget,
        percentage: overallPercentage,
        status: overallStatus
      }
    };
  }, [expenses, budgets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: BudgetStatus): string => {
    switch (status) {
      case 'over':
        return 'text-red-500';
      case 'near':
        return 'text-yellow-500';
      case 'under':
        return 'text-green-500';
    }
  };

  const getProgressColor = (status: BudgetStatus): string => {
    switch (status) {
      case 'over':
        return 'bg-red-500';
      case 'near':
        return 'bg-yellow-500';
      case 'under':
        return 'bg-green-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No budget data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Overall Budget</h3>
            <span className={cn("text-sm font-medium", getStatusColor(progress.overall.status))}>
              {formatCurrency(progress.overall.spent)} / {formatCurrency(progress.overall.budget)}
            </span>
          </div>
          <Progress
            value={Math.min(progress.overall.percentage, 100)}
            className={cn("h-2", getProgressColor(progress.overall.status))}
          />
          {progress.overall.status === 'over' && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Over Budget</AlertTitle>
              <AlertDescription>
                You've exceeded your overall budget by {formatCurrency(progress.overall.spent - progress.overall.budget)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-sm font-medium mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {progress.categories.map((category, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{category.category}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                    </div>
                  </div>
                  <span className={cn("text-sm font-medium", getStatusColor(category.status))}>
                    {Math.round(category.percentage)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(category.percentage, 100)}
                  className={cn("h-2", getProgressColor(category.status))}
                />
                {category.status === 'over' && (
                  <div className="text-sm text-red-500 mt-1">
                    Over by {formatCurrency(category.spent - category.budget)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}