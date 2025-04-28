<script lang="ts">
import { tripStore } from '$lib/stores/tripStore';
import type { Trip, TripSummary } from '$lib/types/trip';
import type { Expense } from '$lib/types/expense';
import { onMount } from 'svelte';
import { formatDate, formatCurrency } from '$lib/utils';
import ExpenseList from '$lib/components/expenses/ExpenseList.svelte';

export let tripId: number;

let trip: Trip | null = null;
let summary: TripSummary | null = null;
let loading = false;
let error: string | null = null;

onMount(async () => {
  loading = true;
  try {
    const [tripData, summaryData] = await Promise.all([
      tripStore.fetchTrips().then(trips => trips.find(t => t.id === tripId)),
      tripStore.getTripSummary(tripId)
    ]);
    
    trip = tripData || null;
    summary = summaryData;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load trip details';
  } finally {
    loading = false;
  }
});

function getBudgetUtilizationColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

function getStatusColor(status: Trip['status']): string {
  switch (status) {
    case 'Planned':
      return 'bg-blue-100 text-blue-800';
    case 'InProgress':
      return 'bg-green-100 text-green-800';
    case 'Completed':
      return 'bg-gray-100 text-gray-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
</script>

{#if loading}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
{:else if error}
  <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong class="font-bold">Error!</strong>
    <span class="block sm:inline">{error}</span>
  </div>
{:else if !trip}
  <div class="text-center py-12">
    <h3 class="text-lg font-medium text-gray-900">Trip not found</h3>
    <p class="mt-1 text-sm text-gray-500">The requested trip could not be found.</p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Trip Header -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{trip.title}</h1>
          <p class="mt-1 text-gray-500">{trip.description || 'No description'}</p>
        </div>
        <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
          {trip.status}
        </span>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 class="text-sm font-medium text-gray-500">Dates</h3>
          <p class="mt-1 text-sm text-gray-900">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-500">Location</h3>
          <p class="mt-1 text-sm text-gray-900">{trip.location || 'Not specified'}</p>
        </div>
        {#if trip.budget}
          <div>
            <h3 class="text-sm font-medium text-gray-500">Budget</h3>
            <p class="mt-1 text-sm text-gray-900">{formatCurrency(trip.budget, trip.currency)}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">Spent</h3>
            <p class="mt-1 text-sm text-gray-900">
              {formatCurrency(trip.totalExpenses, trip.currency)}
              <span class={`text-xs ${getBudgetUtilizationColor(trip.totalExpenses / trip.budget * 100)}`}>
                ({Math.round(trip.totalExpenses / trip.budget * 100)}%)
              </span>
            </p>
          </div>
        {/if}
      </div>

      {#if trip.tags && trip.tags.length > 0}
        <div class="mt-6">
          <h3 class="text-sm font-medium text-gray-500">Tags</h3>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each trip.tags as tag}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {tag}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Trip Statistics -->
    {#if summary}
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900">Expense Summary</h2>
        
        <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Total Expenses</h3>
            <p class="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(summary.totalExpenses, trip.currency)}
            </p>
          </div>
          
          {#if trip.budget}
            <div>
              <h3 class="text-sm font-medium text-gray-500">Budget Utilization</h3>
              <div class="mt-1">
                <div class="relative pt-1">
                  <div class="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      style="width: {Math.min(summary.budgetUtilization || 0, 100)}%"
                    ></div>
                  </div>
                  <div class="mt-1 text-sm font-semibold text-gray-700">
                    {Math.round(summary.budgetUtilization || 0)}%
                  </div>
                </div>
              </div>
            </div>
          {/if}
          
          <div>
            <h3 class="text-sm font-medium text-gray-500">Expense Count</h3>
            <p class="mt-1 text-2xl font-semibold text-gray-900">{summary.expensesByCategory.length}</p>
          </div>
        </div>

        {#if Object.keys(summary.expensesByCategory).length > 0}
          <div class="mt-6">
            <h3 class="text-sm font-medium text-gray-500">Expenses by Category</h3>
            <div class="mt-2 space-y-2">
              {#each Object.entries(summary.expensesByCategory) as [category, amount]}
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">{category}</span>
                  <span class="text-sm font-medium text-gray-900">
                    {formatCurrency(amount, trip.currency)}
                  </span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if summary.dailyExpenses.length > 0}
          <div class="mt-6">
            <h3 class="text-sm font-medium text-gray-500">Daily Expenses</h3>
            <div class="mt-2 h-48">
              <!-- Add chart component here -->
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Trip Expenses -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-medium text-gray-900">Expenses</h2>
        <a
          href="/trips/{trip.id}/expenses/new"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Add Expense
        </a>
      </div>

      <ExpenseList tripId={trip.id} />
    </div>
  </div>
{/if}