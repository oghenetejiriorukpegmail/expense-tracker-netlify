<script lang="ts">
import { tripStore, filteredTrips } from '$lib/stores/tripStore';
import type { Trip } from '$lib/types/trip';
import { onMount } from 'svelte';
import { formatDate, formatCurrency } from '$lib/utils';

export let viewMode: 'list' | 'grid' = 'list';

let loading = false;
let error: string | null = null;

onMount(async () => {
  loading = true;
  try {
    await tripStore.fetchTrips();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load trips';
  } finally {
    loading = false;
  }
});

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

async function handleDelete(trip: Trip) {
  if (!confirm(`Are you sure you want to delete "${trip.title}"?`)) return;
  
  try {
    await tripStore.deleteTrip(trip.id);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to delete trip';
  }
}

async function handleStatusChange(trip: Trip, newStatus: Trip['status']) {
  try {
    await tripStore.updateTrip(trip.id, { status: newStatus });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to update trip status';
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
{:else if $filteredTrips.length === 0}
  <div class="text-center py-12">
    <h3 class="text-lg font-medium text-gray-900">No trips found</h3>
    <p class="mt-1 text-sm text-gray-500">Get started by creating a new trip.</p>
  </div>
{:else}
  <div class={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
    {#each $filteredTrips as trip (trip.id)}
      <div class={viewMode === 'grid' 
        ? 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
        : 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow'
      }>
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-medium text-gray-900">
              <a href="/trips/{trip.id}" class="hover:text-primary">
                {trip.title}
              </a>
            </h3>
            <p class="mt-1 text-sm text-gray-500">{trip.description || 'No description'}</p>
          </div>
          <div class="flex items-center space-x-2">
            <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
              {trip.status}
            </span>
            <div class="relative">
              <button class="p-1 hover:bg-gray-100 rounded-full">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <!-- Quick actions dropdown menu -->
              <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden">
                <div class="py-1" role="menu">
                  {#if trip.status === 'Planned'}
                    <button
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      on:click={() => handleStatusChange(trip, 'InProgress')}
                    >
                      Start Trip
                    </button>
                  {/if}
                  {#if trip.status === 'InProgress'}
                    <button
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      on:click={() => handleStatusChange(trip, 'Completed')}
                    >
                      Complete Trip
                    </button>
                  {/if}
                  <a
                    href="/trips/{trip.id}/edit"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Trip
                  </a>
                  <button
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    on:click={() => handleDelete(trip)}
                  >
                    Delete Trip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Dates:</span>
            <div class="font-medium">
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </div>
          </div>
          <div>
            <span class="text-gray-500">Location:</span>
            <div class="font-medium">{trip.location || 'Not specified'}</div>
          </div>
          {#if trip.budget}
            <div>
              <span class="text-gray-500">Budget:</span>
              <div class="font-medium">{formatCurrency(trip.budget, trip.currency)}</div>
            </div>
            <div>
              <span class="text-gray-500">Spent:</span>
              <div class="font-medium">
                {formatCurrency(trip.totalExpenses, trip.currency)}
                <span class="text-sm text-gray-500">
                  ({Math.round((trip.totalExpenses / trip.budget) * 100)}%)
                </span>
              </div>
            </div>
          {/if}
        </div>

        {#if trip.tags && trip.tags.length > 0}
          <div class="mt-4 flex flex-wrap gap-2">
            {#each trip.tags as tag}
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {tag}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}