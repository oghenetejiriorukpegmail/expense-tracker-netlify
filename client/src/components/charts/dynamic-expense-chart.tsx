import { lazy, Suspense } from 'react';
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import the ExpenseChart component
const ExpenseChart = lazy(() => import('./expense-chart'));

// Define the props interface
interface ExpenseChartProps {
  expenseData: Record<string, number>;
  isLoading: boolean;
}

// Loading fallback component
const ChartLoadingFallback = () => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">Expense Breakdown</CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </CardContent>
  </Card>
);

// Wrapper component that uses Suspense
export default function DynamicExpenseChart(props: ExpenseChartProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ExpenseChart {...props} />
    </Suspense>
  );
}