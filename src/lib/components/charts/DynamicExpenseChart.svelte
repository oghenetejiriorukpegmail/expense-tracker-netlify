<script lang="ts">
  import { onMount } from 'svelte';
  import ExpenseChart from './ExpenseChart.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  export let expenseData: Record<string, number>;
  export let isLoading: boolean;

  let mounted = false;

  onMount(() => {
    mounted = true;
  });
</script>

{#if mounted}
  <ExpenseChart expenses={Object.entries(expenseData).map(([id, amount]) => ({
    id,
    amount,
    category: id,
    date: new Date().toISOString()
  }))} {isLoading} />
{:else}
  <Card>
    <header class="px-6 py-4 border-b border-border">
      <h3 class="text-lg font-semibold">Expense Breakdown</h3>
    </header>
    <div class="p-6">
      <div class="h-64 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  </Card>
{/if}