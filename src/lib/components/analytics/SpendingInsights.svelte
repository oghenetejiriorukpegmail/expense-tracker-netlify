<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
  import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from "lucide-svelte";

  // Props
  export let expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }> = [];
  
  export let historicalAverage: Record<string, number> = {};
  export let isLoading: boolean = false;

  // Types
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

  interface Pattern {
    category: string;
    currentSpending: number;
    averageSpending: number;
    percentageChange: number;
    frequency: number;
  }

  interface Insights {
    anomalies: Anomaly[];
    savingsOpportunities: SavingsOpportunity[];
    patterns: Pattern[];
  }

  // Reactive declarations
  $: insights = calculateInsights(expenses, historicalAverage);

  // Functions
  function calculateInsights(expenses, historicalAverage): Insights | null {
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
    }, {} as Record<string, { total: number; count: number; expenses: typeof expenses }>);

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
    const patterns: Pattern[] = Object.entries(categoryTotals).map(([category, data]) => {
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
    <CardTitle>Spending Insights</CardTitle>
  </CardHeader>
  <CardContent>
    {#if isLoading}
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !insights}
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        No spending data available
      </div>
    {:else}
      <div class="space-y-6">
        <!-- Anomalies -->
        {#if insights.anomalies.length > 0}
          <div>
            <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle class="h-4 w-4" />
              Unusual Spending Detected
            </h3>
            <div class="space-y-2">
              {#each insights.anomalies.slice(0, 3) as anomaly, index}
                <Alert>
                  <AlertTitle class="text-sm font-medium">
                    {anomaly.category} - {formatCurrency(anomaly.amount)}
                  </AlertTitle>
                  <AlertDescription class="text-sm text-muted-foreground">
                    {Math.round(anomaly.percentageDeviation)}% above average on {new Date(anomaly.date).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Savings Opportunities -->
        {#if insights.savingsOpportunities.length > 0}
          <div>
            <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb class="h-4 w-4" />
              Savings Opportunities
            </h3>
            <div class="space-y-3">
              {#each insights.savingsOpportunities.slice(0, 3) as opportunity, index}
                <div class="p-3 bg-card rounded-lg border">
                  <div class="font-medium">{opportunity.category}</div>
                  <div class="text-sm text-muted-foreground">
                    Current: {formatCurrency(opportunity.currentSpending)} vs Average: {formatCurrency(opportunity.averageSpending)}
                  </div>
                  <div class="text-sm font-medium text-green-500 mt-1">
                    Potential savings: {formatCurrency(opportunity.potentialSavings)}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Spending Patterns -->
        <div>
          <h3 class="text-sm font-medium mb-3">Spending Patterns</h3>
          <div class="space-y-3">
            {#each insights.patterns.slice(0, 5) as pattern, index}
              <div class="p-3 bg-card rounded-lg border">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{pattern.category}</div>
                    <div class="text-sm text-muted-foreground">
                      {pattern.frequency} transactions this period
                    </div>
                  </div>
                  <div class="flex items-center gap-1 {pattern.percentageChange > 0 ? 'text-red-500' : 'text-green-500'}">
                    {#if pattern.percentageChange > 0}
                      <TrendingUp class="h-4 w-4" />
                    {:else}
                      <TrendingDown class="h-4 w-4" />
                    {/if}
                    <span class="font-medium">{Math.abs(Math.round(pattern.percentageChange))}%</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>