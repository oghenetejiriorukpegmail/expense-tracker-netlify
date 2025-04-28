<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'; // Assuming shadcn-svelte card
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'; // Assuming shadcn-svelte tabs
  import { TrendingUp, TrendingDown, Minus } from 'lucide-svelte'; // Assuming lucide-svelte icons
  import { format, subMonths, subYears, startOfMonth, endOfMonth, parseISO } from 'date-fns';
  import type { Expense } from '../../../shared/schema'; // Use shared schema type

  export let expenses: Expense[] = [];
  export let isLoading: boolean = false;

  interface PeriodComparison {
    category: string;
    currentPeriod: number;
    previousPeriod: number;
    percentageChange: number;
    trend: 'up' | 'down' | 'stable';
  }

  // Reactive calculation for comparisons
  $: comparisons = calculateComparisons(expenses);

  function calculateComparisons(expenseData: Expense[]) {
    if (!expenseData || !expenseData.length) return null;

    const calculatePeriodTotals = (startDate: Date, endDate: Date) => {
      return expenseData.reduce((acc, expense) => {
        // Use parseISO since expense.date is string 'YYYY-MM-DD'
        const expenseDate = parseISO(expense.date);
        if (expenseDate >= startDate && expenseDate <= endDate) {
          const category = expense.type || 'Uncategorized'; // Use 'type' field from schema
          const amount = parseFloat(expense.cost); // Use 'cost' field from schema
          if (!isNaN(amount)) {
            if (!acc[category]) {
              acc[category] = 0;
            }
            acc[category] += amount;
          }
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

      const categories = new Set([
        ...Object.keys(currentTotals),
        ...Object.keys(previousTotals)
      ]);

      return Array.from(categories).map(category => {
        const currentAmount = currentTotals[category] || 0;
        const previousAmount = previousTotals[category] || 0;
        let percentageChange: number;

        if (previousAmount === 0) {
          percentageChange = currentAmount > 0 ? Infinity : 0; // Handle division by zero
        } else {
          percentageChange = ((currentAmount - previousAmount) / previousAmount) * 100;
        }

        let trend: 'up' | 'down' | 'stable';
        if (percentageChange === Infinity || percentageChange > 5) {
          trend = 'up';
        } else if (percentageChange < -5) {
          trend = 'down';
        } else {
          trend = 'stable';
        }

        // Handle Infinity for display
        const displayPercentageChange = percentageChange === Infinity ? 100 : Math.round(percentageChange);


        return {
          category,
          currentPeriod: currentAmount,
          previousPeriod: previousAmount,
          percentageChange: displayPercentageChange, // Store rounded/handled value
          trend
        };
      }).sort((a, b) => {
         // Sort primarily by trend significance (up/down before stable), then by magnitude
         const trendOrder = { up: 2, down: 2, stable: 1 };
         const trendDiff = trendOrder[b.trend] - trendOrder[a.trend];
         if (trendDiff !== 0) return trendDiff;
         return Math.abs(b.percentageChange) - Math.abs(a.percentageChange);
      });
    };

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    // Corrected: Last year comparison should be current month vs same month last year
    const lastYearCurrentMonthStart = startOfMonth(subYears(now, 1));
    const lastYearCurrentMonthEnd = endOfMonth(subYears(now, 1));


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
        lastYearCurrentMonthStart, // Compare current month with same month last year
        lastYearCurrentMonthEnd
      )
    };
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // TODO: Make currency dynamic based on settings
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to get trend color class
  function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'text-red-500';
      case 'down': return 'text-green-500';
      case 'stable': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  }

</script>

<Card>
  <CardHeader>
    <CardTitle>Comparison Analysis</CardTitle>
  </CardHeader>
  <CardContent>
    {#if isLoading}
      <div class="h-[400px] flex items-center justify-center">
        <!-- Basic loading spinner -->
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !comparisons || (!comparisons.monthOverMonth.length && !comparisons.yearOverYear.length)}
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        Not enough data for comparison analysis.
      </div>
    {:else}
      <Tabs value="mom" class="space-y-4">
        <TabsList>
          <TabsTrigger value="mom">Month over Month</TabsTrigger>
          <TabsTrigger value="yoy">Year over Year</TabsTrigger>
        </TabsList>

        <TabsContent value="mom">
          <div class="space-y-4">
            {#each comparisons.monthOverMonth as comparison (comparison.category)}
              <div class="p-4 bg-card rounded-lg border">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">{comparison.category}</h3>
                  <div class="flex items-center gap-2">
                    {#if comparison.trend === 'up'}
                      <TrendingUp class="h-4 w-4 {getTrendColor(comparison.trend)}" />
                    {:else if comparison.trend === 'down'}
                      <TrendingDown class="h-4 w-4 {getTrendColor(comparison.trend)}" />
                    {:else}
                      <Minus class="h-4 w-4 {getTrendColor(comparison.trend)}" />
                    {/if}
                    <span class="font-medium {getTrendColor(comparison.trend)}">
                      {comparison.percentageChange > 0 ? '+' : ''}{comparison.percentageChange}%
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div class="text-muted-foreground">Current Month</div>
                    <div class="font-medium">{formatCurrency(comparison.currentPeriod)}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">Previous Month</div>
                    <div class="font-medium">{formatCurrency(comparison.previousPeriod)}</div>
                  </div>
                </div>
              </div>
            {:else}
              <p class="text-muted-foreground text-center py-4">No data for month-over-month comparison.</p>
            {/each}
          </div>
        </TabsContent>

        <TabsContent value="yoy">
          <div class="space-y-4">
            {#each comparisons.yearOverYear as comparison (comparison.category)}
              <div class="p-4 bg-card rounded-lg border">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium">{comparison.category}</h3>
                  <div class="flex items-center gap-2">
                     {#if comparison.trend === 'up'}
                      <TrendingUp class="h-4 w-4 {getTrendColor(comparison.trend)}" />
                    {:else if comparison.trend === 'down'}
                      <TrendingDown class="h-4 w-4 {getTrendColor(comparison.trend)}" />
                    {:else}
                      <Minus class="h-4 w-4 {getTrendColor(comparison.trend)}" />
                    {/if}
                    <span class="font-medium {getTrendColor(comparison.trend)}">
                       {comparison.percentageChange > 0 ? '+' : ''}{comparison.percentageChange}%
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div class="text-muted-foreground">Current Month</div>
                    <div class="font-medium">{formatCurrency(comparison.currentPeriod)}</div>
                  </div>
                  <div>
                    <div class="text-muted-foreground">Same Month Last Year</div>
                    <div class="font-medium">{formatCurrency(comparison.previousPeriod)}</div>
                  </div>
                </div>
              </div>
             {:else}
              <p class="text-muted-foreground text-center py-4">No data for year-over-year comparison.</p>
            {/each}
          </div>
        </TabsContent>
      </Tabs>
    {/if}
  </CardContent>
</Card>