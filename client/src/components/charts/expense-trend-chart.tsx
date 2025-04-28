import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
}

interface ExpenseTrendChartProps {
  expenses: Expense[];
  isLoading: boolean;
}

type TimeFrame = '7d' | '30d' | '90d';

export default function ExpenseTrendChart({ expenses, isLoading }: ExpenseTrendChartProps) {
  const chartData = useMemo(() => {
    if (!expenses.length) return null;

    const calculateMovingAverage = (data: { date: string; amount: number }[], days: number) => {
      return data.map((entry, index) => {
        const start = Math.max(0, index - days + 1);
        const subset = data.slice(start, index + 1);
        const sum = subset.reduce((acc, curr) => acc + curr.amount, 0);
        return {
          ...entry,
          movingAverage: sum / subset.length
        };
      });
    };

    const generateTimeFrameData = (days: number) => {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      // Create array of all dates in range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Initialize daily totals
      const dailyData = dateRange.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        amount: 0,
        count: 0
      }));

      // Aggregate expenses by date
      expenses.forEach(expense => {
        const expenseDate = expense.date.split('T')[0];
        const dayData = dailyData.find(d => d.date === expenseDate);
        if (dayData) {
          dayData.amount += expense.amount;
          dayData.count += 1;
        }
      });

      // Calculate moving averages
      return calculateMovingAverage(dailyData, 7);
    };

    return {
      '7d': generateTimeFrameData(7),
      '30d': generateTimeFrameData(30),
      '90d': generateTimeFrameData(90)
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

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Trends</CardTitle>
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
        <CardTitle>Expense Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="30d" className="space-y-4">
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>

          {(['7d', '30d', '90d'] as TimeFrame[]).map((timeFrame) => (
            <TabsContent key={timeFrame} value={timeFrame}>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData[timeFrame]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      interval={timeFrame === '7d' ? 0 : 'preserveEnd'}
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value)]}
                      labelFormatter={formatDate}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Daily Total"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="movingAverage"
                      name="7-Day Average"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
