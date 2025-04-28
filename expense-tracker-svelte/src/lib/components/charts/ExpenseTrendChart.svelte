<script lang="ts">
  import { Card } from '$lib/components/ui/Card.svelte';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { format, subDays, eachDayOfInterval } from 'date-fns';
  import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  } from 'recharts';

  // Accept either expenses array or direct trendData object
  export let expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }> = [];
  
  export let trendData: { labels: string[], data: number[] } | undefined = undefined;
  export let isLoading = false;

  type TimeFrame = '7d' | '30d' | '90d';
  
  // Reactive chart data
  $: chartData = trendData ? generateChartDataFromTrendData(trendData) : generateChartData(expenses);

  // Function to generate chart data from trendData object
  function generateChartDataFromTrendData(data: { labels: string[], data: number[] }) {
    if (!data || !data.labels || !data.data || data.labels.length === 0) return null;

    // Create a simple dataset for each timeframe
    // For simplicity, we'll use the same data for all timeframes
    const timeframeData = data.labels.map((label, index) => ({
      date: label,
      amount: data.data[index] || 0,
      movingAverage: data.data[index] || 0 // Simple case, just use the same value
    }));

    return {
      '7d': timeframeData,
      '30d': timeframeData,
      '90d': timeframeData
    };
  }

  function generateChartData(expenses) {
    if (!expenses || !expenses.length) return null;

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
  }

  // Format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Format date
  function formatDate(dateStr: string) {
    return format(new Date(dateStr), 'MMM d');
  }
</script>

{#if isLoading}
  <Card>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-4">Expense Trends</h3>
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  </Card>
{:else if !chartData}
  <Card>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-4">Expense Trends</h3>
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        No expense data available
      </div>
    </div>
  </Card>
{:else}
  <Card>
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-4">Expense Trends</h3>
      
      <Tabs defaultValue="30d" class="space-y-4">
        <TabsList>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
        </TabsList>

        {#each ['7d', '30d', '90d'] as timeFrame}
          <TabsContent value={timeFrame}>
            <div class="h-[400px]">
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
                    formatter={(value) => [formatCurrency(value)]}
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
        {/each}
      </Tabs>
    </div>
  </Card>
{/if}