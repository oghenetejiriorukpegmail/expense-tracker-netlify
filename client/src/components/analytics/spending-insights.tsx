import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface SpendingInsightsProps {
  expenses: Expense[];
  historicalAverage: Record<string, number>;
  isLoading: boolean;
}

interface Anomaly {
  category: string;
  amount: number;
  average: number;
  percentageDeviation: number;
  date: string;
}

interface SavingsOpportunity {
  category: string;
  currentSpending: number;
  averageSpending: number;
  potentialSavings: number;
}

export default function SpendingInsights({ expenses, historicalAverage, isLoading }: SpendingInsightsProps) {
  const insights = useMemo(() => {
    if (!expenses.length) return null;

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = {
          total: 0,
          count: 0,
          expenses: []
        };
      }
      acc[exp.category].total += exp.amount;
      acc[exp.category].count += 1;
      acc[exp.category].expenses.push(exp);
      return acc;
    }, {} as Record<string, { total: number; count: number; expenses: Expense[] }>);

    // Detect anomalies (expenses significantly higher than historical average)
    const anomalies: Anomaly[] = [];
    Object.entries(categoryTotals).forEach(([category, data]) => {
      const average = historicalAverage[category] || 0;
      data.expenses.forEach(exp => {
        const percentageDeviation = ((exp.amount - average) / average) * 100;
        if (percentageDeviation > 50) { // More than 50% above average
          anomalies.push({
            category,
            amount: exp.amount,
            average,
            percentageDeviation,
            date: exp.date
          });
        }
      });
    });

    // Identify savings opportunities
    const savingsOpportunities: SavingsOpportunity[] = Object.entries(categoryTotals)
      .map(([category, data]) => {
        const average = historicalAverage[category] || 0;
        const monthlySpending = data.total;
        const potentialSavings = monthlySpending - average;
        return {
          category,
          currentSpending: monthlySpending,
          averageSpending: average,
          potentialSavings
        };
      })
      .filter(opp => opp.potentialSavings > 0)
      .sort((a, b) => b.potentialSavings - a.potentialSavings);

    // Identify spending patterns
    const patterns = Object.entries(categoryTotals).map(([category, data]) => {
      const average = historicalAverage[category] || 0;
      const currentSpending = data.total;
      const percentageChange = ((currentSpending - average) / average) * 100;
      return {
        category,
        currentSpending,
        averageSpending: average,
        percentageChange,
        frequency: data.count
      };
    });

    return {
      anomalies,
      savingsOpportunities,
      patterns
    };
  }, [expenses, historicalAverage]);

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
          <CardTitle>Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No spending data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Anomalies */}
        {insights.anomalies.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Unusual Spending Detected
            </h3>
            <div className="space-y-2">
              {insights.anomalies.slice(0, 3).map((anomaly, index) => (
                <Alert key={index}>
                  <AlertTitle className="text-sm font-medium">
                    {anomaly.category} - {formatCurrency(anomaly.amount)}
                  </AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground">
                    {Math.round(anomaly.percentageDeviation)}% above average on {new Date(anomaly.date).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Savings Opportunities */}
        {insights.savingsOpportunities.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Savings Opportunities
            </h3>
            <div className="space-y-3">
              {insights.savingsOpportunities.slice(0, 3).map((opportunity, index) => (
                <div key={index} className="p-3 bg-card rounded-lg border">
                  <div className="font-medium">{opportunity.category}</div>
                  <div className="text-sm text-muted-foreground">
                    Current: {formatCurrency(opportunity.currentSpending)} vs Average: {formatCurrency(opportunity.averageSpending)}
                  </div>
                  <div className="text-sm font-medium text-green-500 mt-1">
                    Potential savings: {formatCurrency(opportunity.potentialSavings)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spending Patterns */}
        <div>
          <h3 className="text-sm font-medium mb-3">Spending Patterns</h3>
          <div className="space-y-3">
            {insights.patterns.slice(0, 5).map((pattern, index) => (
              <div key={index} className="p-3 bg-card rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{pattern.category}</div>
                    <div className="text-sm text-muted-foreground">
                      {pattern.frequency} transactions this period
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${pattern.percentageChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {pattern.percentageChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="font-medium">{Math.abs(Math.round(pattern.percentageChange))}%</span>
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