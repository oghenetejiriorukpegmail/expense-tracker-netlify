import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ExpenseChart from '../components/charts/expense-chart';
import ExpenseTrendChart from '../components/charts/expense-trend-chart';
import BudgetProgress from '../components/analytics/budget-progress';
import ExpenseSummary from '../components/analytics/expense-summary';
import SpendingInsights from '../components/analytics/spending-insights';
import ComparisonAnalysis from '../components/analytics/comparison-analysis';
import ReportGeneratorModal from '../components/analytics/report-generator-modal';
import { DateRangePicker } from '../components/ui/date-range-picker';
import { addDays, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const handleFromChange = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({ ...prev, from: date }));
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({ ...prev, to: date }));
    }
  };

  // Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/aggregate?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    }
  });

  // Fetch budgets
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await fetch('/api/budgets');
      if (!response.ok) throw new Error('Failed to fetch budgets');
      return response.json();
    }
  });

  // Fetch historical averages
  const { data: historicalAverage = {}, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ['historical-average'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/statistics?startDate=' + 
        subDays(new Date(), 365).toISOString() + 
        '&endDate=' + new Date().toISOString());
      if (!response.ok) throw new Error('Failed to fetch historical data');
      const data = await response.json();
      return data.byCategory;
    }
  });

  const isLoading = isLoadingExpenses || isLoadingBudgets || isLoadingHistorical;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onFromChange={handleFromChange}
            onToChange={handleToChange}
          />
          <ReportGeneratorModal
            expenses={expenses}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Row - Summary and Budget Progress */}
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseSummary
              expenses={expenses}
              isLoading={isLoading}
            />
            <BudgetProgress
              expenses={expenses}
              budgets={budgets}
              isLoading={isLoading}
            />
          </div>

          {/* Bottom Row - Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseChart
              expenses={expenses}
              isLoading={isLoading}
            />
            <SpendingInsights
              expenses={expenses}
              historicalAverage={historicalAverage}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseTrendChart
              expenses={expenses}
              isLoading={isLoading}
            />
            <SpendingInsights
              expenses={expenses}
              historicalAverage={historicalAverage}
              isLoading={isLoading}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <BudgetProgress
              expenses={expenses}
              budgets={budgets}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ComparisonAnalysis
              expenses={expenses}
              isLoading={isLoading}
            />
            <ExpenseTrendChart
              expenses={expenses}
              isLoading={isLoading}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseChart
              expenses={expenses}
              isLoading={isLoading}
            />
            <SpendingInsights
              expenses={expenses}
              historicalAverage={historicalAverage}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}