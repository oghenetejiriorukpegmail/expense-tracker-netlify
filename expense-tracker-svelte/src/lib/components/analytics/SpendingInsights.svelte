<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExpenseData } from '$lib/types';
  
  export let expenses: ExpenseData[] = [];
  export let budgets: Record<string, number> = {};
  
  let spendingPatterns: Array<{category: string; trend: 'up' | 'down' | 'stable'; percentage: number}> = [];
  let budgetStatus: Array<{category: string; spent: number; budget: number; percentage: number}> = [];
  let savingsRecommendations: Array<{category: string; suggestion: string; potentialSavings: number}> = [];
  let isLoading = true;

  function analyzeTrends() {
    // Group expenses by category and analyze month-over-month changes
    const categoryTrends = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Uncategorized';
      const month = new Date(expense.date).getMonth();
      
      if (!acc[category]) {
        acc[category] = { months: Array(12).fill(0) };
      }
      acc[category].months[month] += expense.amount;
      return acc;
    }, {} as Record<string, { months: number[] }>);

    // Calculate trends
    spendingPatterns = Object.entries(categoryTrends).map(([category, data]) => {
      const recentMonths = data.months.slice(-3);
      const avgChange = (recentMonths[2] - recentMonths[0]) / recentMonths[0] * 100;
      
      return {
        category,
        trend: avgChange > 5 ? 'up' : avgChange < -5 ? 'down' : 'stable',
        percentage: Math.abs(avgChange)
      };
    });
  }

  function trackBudgets() {
    // Calculate budget status for each category
    budgetStatus = Object.entries(budgets).map(([category, budgetAmount]) => {
      const spent = expenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        category,
        spent,
        budget: budgetAmount,
        percentage: (spent / budgetAmount) * 100
      };
    });
  }

  function generateRecommendations() {
    // Generate savings recommendations based on spending patterns and budget status
    savingsRecommendations = budgetStatus
      .filter(status => status.percentage > 90)
      .map(status => {
        const overspent = status.spent - status.budget;
        return {
          category: status.category,
          suggestion: `Consider reducing ${status.category} expenses by ${Math.round(overspent)}`,
          potentialSavings: overspent
        };
      });

    // Add recommendations for categories with upward trends
    spendingPatterns
      .filter(pattern => pattern.trend === 'up' && pattern.percentage > 20)
      .forEach(pattern => {
        savingsRecommendations.push({
          category: pattern.category,
          suggestion: `${pattern.category} spending has increased by ${Math.round(pattern.percentage)}%. Consider setting a budget.`,
          potentialSavings: 0
        });
      });
  }

  $: {
    if (expenses.length > 0) {
      analyzeTrends();
      trackBudgets();
      generateRecommendations();
    }
  }

  onMount(() => {
    isLoading = false;
  });
</script>

<div class="grid gap-4 p-4">
  <!-- Spending Patterns -->
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold mb-2">Spending Patterns</h3>
    {#if isLoading}
      <div class="animate-pulse space-y-2">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    {:else}
      <div class="space-y-2">
        {#each spendingPatterns as pattern}
          <div class="flex items-center justify-between">
            <span class="text-gray-700">{pattern.category}</span>
            <div class="flex items-center">
              {#if pattern.trend === 'up'}
                <span class="text-red-500">↑ {pattern.percentage.toFixed(1)}%</span>
              {:else if pattern.trend === 'down'}
                <span class="text-green-500">↓ {pattern.percentage.toFixed(1)}%</span>
              {:else}
                <span class="text-gray-500">→ Stable</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Budget Tracking -->
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold mb-2">Budget Status</h3>
    {#if isLoading}
      <div class="animate-pulse space-y-2">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    {:else}
      <div class="space-y-3">
        {#each budgetStatus as status}
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>{status.category}</span>
              <span>${status.spent.toFixed(2)} / ${status.budget.toFixed(2)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                class:bg-red-500={status.percentage > 90}
                class:bg-yellow-500={status.percentage > 75 && status.percentage <= 90}
                class:bg-green-500={status.percentage <= 75}
                style="width: {Math.min(status.percentage, 100)}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Savings Recommendations -->
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold mb-2">Savings Recommendations</h3>
    {#if isLoading}
      <div class="animate-pulse space-y-2">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    {:else}
      {#if savingsRecommendations.length > 0}
        <div class="space-y-2">
          {#each savingsRecommendations as recommendation}
            <div class="p-2 bg-blue-50 rounded">
              <p class="text-sm text-blue-800">{recommendation.suggestion}</p>
              {#if recommendation.potentialSavings > 0}
                <p class="text-xs text-blue-600 mt-1">
                  Potential savings: ${recommendation.potentialSavings.toFixed(2)}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-gray-500">No recommendations at this time. Keep up the good work!</p>
      {/if}
    {/if}
  </div>
</div>