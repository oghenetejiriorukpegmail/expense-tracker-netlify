<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExpenseData } from '$lib/types';
  
  export let expenses: ExpenseData[] = [];
  export let timeframe: 'week' | 'month' | 'year' = 'month';
  
  let totalExpenses = 0;
  let categoryBreakdown: Record<string, number> = {};
  let previousPeriodComparison = 0;
  let isLoading = true;
  
  $: {
    if (expenses.length > 0) {
      // Calculate total expenses
      totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate category breakdown
      categoryBreakdown = expenses.reduce((acc, expense) => {
        const category = expense.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);
    }
  }
  
  onMount(async () => {
    try {
      // TODO: Fetch previous period data and calculate comparison
      isLoading = false;
    } catch (error) {
      console.error('Error loading expense summary:', error);
      isLoading = false;
    }
  });
</script>

<div class="grid gap-4 p-4">
  <!-- Total Expenses Widget -->
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold mb-2">Total Expenses</h3>
    {#if isLoading}
      <div class="animate-pulse h-8 bg-gray-200 rounded"></div>
    {:else}
      <p class="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
      <p class="text-sm text-gray-500">
        {#if previousPeriodComparison > 0}
          <span class="text-green-500">↑ {previousPeriodComparison}%</span>
        {:else}
          <span class="text-red-500">↓ {Math.abs(previousPeriodComparison)}%</span>
        {/if}
        vs previous {timeframe}
      </p>
    {/if}
  </div>

  <!-- Category Breakdown -->
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold mb-2">Category Breakdown</h3>
    {#if isLoading}
      <div class="animate-pulse space-y-2">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    {:else}
      <div class="space-y-2">
        {#each Object.entries(categoryBreakdown) as [category, amount]}
          <div class="flex justify-between items-center">
            <span class="text-gray-700">{category}</span>
            <span class="font-medium">${amount.toFixed(2)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Period Comparison -->
  <div class="bg-white rounded-lg shadow p-4">
    <h3 class="text-lg font-semibold mb-2">Period Comparison</h3>
    {#if isLoading}
      <div class="animate-pulse h-24 bg-gray-200 rounded"></div>
    {:else}
      <!-- TODO: Add period comparison visualization -->
      <p class="text-sm text-gray-500">Coming soon...</p>
    {/if}
  </div>
</div>