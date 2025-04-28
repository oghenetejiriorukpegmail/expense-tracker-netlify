<script lang="ts">
  import type { PageData } from './$types';
  import ExpenseBreakdownChart from '$lib/components/charts/ExpenseBreakdownChart.svelte';
  import ComparisonAnalysis from '$lib/components/analytics/ComparisonAnalysis.svelte';
  import ExpenseTrendChart from '$lib/components/charts/ExpenseTrendChart.svelte'; // Import the trend chart

  export let data: PageData;

  // Destructure expenses from data
  $: ({ userProfile, expenses, error, loading } = data);
</script>

<div class="p-4 md:p-8 space-y-6">
  {#if loading}
    <p>Loading dashboard...</p>
  {:else if error}
    <div class="text-red-600 bg-red-100 border border-red-400 p-4 rounded">
      <h2 class="font-bold text-lg mb-2">Error Loading Dashboard</h2>
      <p>{error}</p>
      <p class="mt-2">Please try refreshing the page or contact support if the problem persists.</p>
    </div>
  {:else if userProfile}
    <h1 class="text-2xl font-semibold">Welcome back, {userProfile.firstName || userProfile.username}!</h1>

    <!-- Top Row: Summaries & Quick Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Recent Expenses -->
      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-lg mb-2">Recent Expenses</h2>
        {#if expenses && expenses.length > 0}
          <ul class="list-disc pl-5 text-sm text-gray-700 max-h-40 overflow-y-auto">
            {#each expenses.slice(0, 5) as expense}
              <li>{expense.vendor}: ${expense.cost} on {expense.date}</li>
            {/each}
          </ul>
        {:else}
           <p class="text-gray-600">No recent expenses.</p>
        {/if}
        <!-- TODO: Link to full expenses page -->
      </div>

      <!-- Active Trips -->
      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-lg mb-2">Active Trips</h2>
        <p class="text-gray-600">Coming soon...</p>
        <!-- TODO: Fetch and Display active trips summary -->
      </div>

      <!-- Quick Actions -->
      <div class="bg-white p-4 rounded shadow">
        <h2 class="font-semibold text-lg mb-2">Quick Actions</h2>
        <div class="flex flex-col space-y-2 mt-2">
           <a href="/expenses/new" class="text-blue-600 hover:underline">Add New Expense</a>
           <a href="/trips/new" class="text-blue-600 hover:underline">Add New Trip</a>
           <a href="/mileage/new" class="text-blue-600 hover:underline">Add Mileage Log</a>
        </div>
      </div>
    </div>

    <!-- Second Row: Charts & Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
       <!-- Expense Trend Chart -->
       <div class="bg-white p-4 rounded shadow lg:col-span-2">
         <ExpenseTrendChart {expenses} isLoading={loading}/>
       </div>

       <!-- Expense Breakdown & Comparison -->
       <div class="space-y-6">
          <!-- Expense Breakdown Chart -->
          <div class="bg-white p-4 rounded shadow">
            <h2 class="font-semibold text-lg mb-2">Expense Breakdown</h2>
            {#if expenses && expenses.length > 0}
              <ExpenseBreakdownChart {expenses} />
            {:else}
              <p class="text-gray-600 text-center pt-10">No expense data for chart.</p>
            {/if}
          </div>

          <!-- Period Comparison -->
           <div class="bg-white p-4 rounded shadow">
             <ComparisonAnalysis {expenses} isLoading={loading} />
          </div>
       </div>
    </div>

  {:else}
    <p>Could not load user profile. Please try logging in again.</p>
     <a href="/auth" class="text-blue-600 hover:underline">Go to Login</a>
  {/if}
</div>