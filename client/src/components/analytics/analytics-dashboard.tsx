import React from 'react';
import ExpenseChart from '../charts/expense-chart';
import ExpenseTrendChart from '../charts/expense-trend-chart';
import BudgetProgress from './budget-progress';
import ExpenseSummary from './expense-summary';
import SpendingInsights from './spending-insights';
import ComparisonAnalysis from './comparison-analysis';

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

interface AnalyticsDashboardProps {
  expenses: Expense[];
  budgetData: Budget[];
  historicalAverage: Record<string, number>;
  isLoading: boolean;
}

export default function AnalyticsDashboard({
  expenses,
  budgetData,
  historicalAverage,
  isLoading
}: AnalyticsDashboardProps) {
  return (
    <div className="grid gap-6">
      {/* Top Row - Summary and Budget Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseSummary
          expenses={expenses}
          isLoading={isLoading}
        />
        <BudgetProgress
          expenses={expenses}
          budgets={budgetData}
          isLoading={isLoading}
        />
      </div>

      {/* Middle Row - Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ExpenseChart
          expenses={expenses}
          isLoading={isLoading}
        />
        <ExpenseTrendChart
          expenses={expenses}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Row - Insights and Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <SpendingInsights
          expenses={expenses}
          historicalAverage={historicalAverage}
          isLoading={isLoading}
        />
        <ComparisonAnalysis
          expenses={expenses}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}