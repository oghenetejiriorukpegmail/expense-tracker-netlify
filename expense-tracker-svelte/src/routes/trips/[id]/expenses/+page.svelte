<script lang="ts">
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { tripStore } from '$lib/stores/tripStore';
import type { Trip } from '$lib/types/trip';
import ExpenseList from '$lib/components/expenses/ExpenseList.svelte';
import { onMount } from 'svelte';

const tripId = parseInt($page.params.id);
let trip: Trip | null = null;
let loading = true;
let error: string | null = null;

// Format date function
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

onMount(async () => {
  try {
    const trips = await tripStore.fetchTrips();
    trip = trips.find(t => t.id === tripId) || null;
    if (!trip) {
      error = 'Trip not found';
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load trip';
  } finally {
    loading = false;
  }
});
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-7xl mx-auto">
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    {:else if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">{error}</span>
      </div>
    {:else if trip}
      <div class="md:flex md:items-center md:justify-between mb-6">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-gray-900">
            Expenses for {trip.title}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
          <a
            href="/trips/{tripId}"
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Trip
          </a>
          <a
            href="/trips/{tripId}/expenses/new"
            class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Add Expense
          </a>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <ExpenseList tripId={trip.id} />
        </div>
      </div>
    {/if}
  </div>
</div>