import { lazy, Suspense } from 'react';
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Dynamically import the ExpenseTrendChart component
const ExpenseTrendChart = lazy(() => import('./expense-trend-chart'));

// Define the props interface
interface ExpenseTrendChartProps {
  trendData: {
    labels: string[];
    data: number[];
  };
  isLoading: boolean;
}

// Loading fallback component
const ChartLoadingFallback = () => (
  <Card className="h-full">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">Expense Trends</CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </CardContent>
  </Card>
);

// Wrapper component that uses Suspense
export default function DynamicExpenseTrendChart(props: ExpenseTrendChartProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <ExpenseTrendChart {...props} />
    </Suspense>
  );
}