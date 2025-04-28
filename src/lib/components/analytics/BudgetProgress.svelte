<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";
  import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert";
  import { AlertTriangle } from "lucide-svelte";

  // Props
  export let expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }> = [];
  
  export let budgets: Array<{
    category: string;
    amount: number;
  }> = [];
  
  export let isLoading: boolean = false;

  // Types
  type BudgetStatus = 'under' | 'near' | 'over';

  interface CategoryProgress {
    category: string;
    spent: number;
    budget: number;
    percentage: number;
    status: BudgetStatus;
  }

  interface OverallProgress {
    spent: number;
    budget: number;
    percentage: number;
    status: BudgetStatus;
  }

  interface BudgetProgressData {
    categories: CategoryProgress[];
    overall: OverallProgress;
  }

  // Reactive declarations
  $: progress = calculateProgress(expenses, budgets);

  // Functions
  function calculateProgress(expenses, budgets): BudgetProgressData | null {
    if (!expenses.length || !budgets.length) return null;

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate progress for each budget category
    const categoryProgress: CategoryProgress[] = budgets.map(budget => {
      const spent = categoryTotals[budget.category] || 0;
      const percentage = (spent / budget.amount) * 100;
      
      let status: BudgetStatus;
      if (percentage >= 100) {
        status = 'over';
      } else if (percentage >= 80) {
        status = 'near';
      } else {
        status = 'under';
      }

      return {
        category: budget.category,
        spent,
        budget: budget.amount,
        percentage,
        status
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // Calculate overall budget progress
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    const overallPercentage = (totalSpent / totalBudget) * 100;

    const overallStatus: BudgetStatus = overallPercentage >= 100 ? 'over' : overallPercentage >= 80 ? 'near' : 'under';

    return {
      categories: categoryProgress,
      overall: {
        spent: totalSpent,
        budget: totalBudget,
        percentage: overallPercentage,
        status: overallStatus
      }
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

  function getStatusColor(status: BudgetStatus): string {
    switch (status) {
      case 'over':
        return 'text-red-500';
      case 'near':
        return 'text-yellow-500';
      case 'under':
        return 'text-green-500';
    }
  }

  function getProgressColor(status: BudgetStatus): string {
    switch (status) {
      case 'over':
        return 'bg-red-500';
      case 'near':
        return 'bg-yellow-500';
      case 'under':
        return 'bg-green-500';
    }
  }
</script>

<Card>
  <CardHeader>
    <CardTitle>Budget Progress</CardTitle>
  </CardHeader>
  <CardContent>
    {#if isLoading}
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !progress}
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        No budget data available
      </div>
    {:else}
      <div class="space-y-6">
        <!-- Overall Progress -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium">Overall Budget</h3>
            <span class="text-sm font-medium {getStatusColor(progress.overall.status)}">
              {formatCurrency(progress.overall.spent)} / {formatCurrency(progress.overall.budget)}
            </span>
          </div>
          <Progress 
            value={Math.min(progress.overall.percentage, 100)} 
            className={getProgressColor(progress.overall.status)}
          />
          {#if progress.overall.status === 'over'}
            <Alert variant="destructive" class="mt-2">
              <AlertTriangle class="h-4 w-4" />
              <AlertTitle>Over Budget</AlertTitle>
              <AlertDescription>
                You've exceeded your overall budget by {formatCurrency(progress.overall.spent - progress.overall.budget)}
              </AlertDescription>
            </Alert>
          {/if}
        </div>

        <!-- Category Breakdown -->
        <div>
          <h3 class="text-sm font-medium mb-4">Category Breakdown</h3>
          <div class="space-y-4">
            {#each progress.categories as category, index}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <div class="font-medium">{category.category}</div>
                    <div class="text-sm text-muted-foreground">
                      {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                    </div>
                  </div>
                  <span class="text-sm font-medium {getStatusColor(category.status)}">
                    {Math.round(category.percentage)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(category.percentage, 100)} 
                  className={getProgressColor(category.status)}
                />
                {#if category.status === 'over'}
                  <div class="text-sm text-red-500 mt-1">
                    Over by {formatCurrency(category.spent - category.budget)}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>