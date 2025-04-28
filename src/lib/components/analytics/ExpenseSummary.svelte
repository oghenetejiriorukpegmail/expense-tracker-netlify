<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp } from "lucide-svelte";

  // Props
  export let expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }> = [];
  
  export let isLoading: boolean = false;

  // Types
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

  interface Summary {
    categories: CategorySummary[];
    monthly: TimePeriodSummary;
    weekly: TimePeriodSummary;
    daily: TimePeriodSummary;
  }

  // Reactive declarations
  $: summary = calculateSummary(expenses);

  // Functions
  function calculateSummary(expenses): Summary | null {
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
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Expense Summary</CardTitle>
  </CardHeader>
  <CardContent>
    {#if isLoading}
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !summary}
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        No expense data available
      </div>
    {:else}
      <Tabs value="monthly" class="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
        </TabsList>

        <!-- Monthly View -->
        <TabsContent value="monthly" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <h2 class="text-2xl font-bold">{formatCurrency(summary.monthly.total)}</h2>
                  </div>
                  <DollarSign class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">Daily Average</p>
                    <h2 class="text-2xl font-bold">{formatCurrency(summary.monthly.average)}</h2>
                  </div>
                  <TrendingUp class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Weekly View -->
        <TabsContent value="weekly" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <h2 class="text-2xl font-bold">{formatCurrency(summary.weekly.total)}</h2>
                  </div>
                  <DollarSign class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">Daily Average</p>
                    <h2 class="text-2xl font-bold">{formatCurrency(summary.weekly.average)}</h2>
                  </div>
                  <TrendingUp class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Daily View -->
        <TabsContent value="daily" class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent class="pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <h2 class="text-2xl font-bold">{formatCurrency(summary.daily.total)}</h2>
                  </div>
                  <DollarSign class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <!-- Top Categories -->
      <div class="mt-6">
        <h3 class="text-sm font-medium mb-4">Top Spending Categories</h3>
        <div class="space-y-4">
          {#each summary.categories as category, index}
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">{category.category}</div>
                <div class="text-sm text-muted-foreground">
                  {category.count} transactions
                </div>
              </div>
              <div class="text-right">
                <div class="font-medium">{formatCurrency(category.total)}</div>
                <div class="flex items-center gap-1 text-sm">
                  {#if category.trend === 'up'}
                    <ArrowUpRight class="h-4 w-4 text-red-500" />
                  {:else if category.trend === 'down'}
                    <ArrowDownRight class="h-4 w-4 text-green-500" />
                  {/if}
                  <span class={category.trend === 'up' ? 'text-red-500' : 'text-green-500'}>
                    {Math.round(category.percentageOfTotal)}%
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </CardContent>
</Card>