<script lang="ts">
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { tripStore } from '$lib/stores/tripStore';
import TripForm from '../../../../components/trips/TripForm.svelte';
import type { Trip } from '$lib/types/trip';
import { onMount } from 'svelte';

const tripId = parseInt($page.params.id);
let trip: Trip | null = null;
let loading = true;
let error: string | null = null;

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

function handleSubmit(updatedTrip: Trip) {
  goto(`/trips/${updatedTrip.id}`);
}

function handleCancel() {
  goto(`/trips/${tripId}`);
}
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-3xl mx-auto">
    <div class="md:flex md:items-center md:justify-between mb-6">
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold text-gray-900">Edit Trip</h1>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
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
          <TripForm {trip} onSubmit={handleSubmit} onCancel={handleCancel} />
        {/if}
      </div>
    </div>
  </div>
</div>