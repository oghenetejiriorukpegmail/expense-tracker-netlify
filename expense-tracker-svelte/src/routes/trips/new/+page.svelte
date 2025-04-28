<script lang="ts">
import { goto } from '$app/navigation';
import TripForm from '../../../components/trips/TripForm.svelte';
import type { Trip } from '$lib/types/trip';

function handleSubmit(trip: Trip) {
  goto(`/trips/${trip.id}`);
}

function handleCancel() {
  goto('/trips');
}
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-3xl mx-auto">
    <div class="md:flex md:items-center md:justify-between mb-6">
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-bold text-gray-900">New Trip</h1>
      </div>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <TripForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  </div>
</div>