<script lang="ts">
import TripList from '../../components/trips/TripList.svelte';
import { tripStore } from '$lib/stores/tripStore';

let viewMode: 'list' | 'grid' = 'list';
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Trips</h1>
    
    <div class="flex items-center space-x-4">
      <!-- View mode toggle -->
      <div class="flex items-center rounded-lg shadow-sm">
        <button
          class={`px-4 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-700'} rounded-l-lg`}
          on:click={() => viewMode = 'list'}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
        <button
          class={`px-4 py-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-700'} rounded-r-lg`}
          on:click={() => viewMode = 'grid'}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </div>

      <a
        href="/trips/new"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        New Trip
      </a>
    </div>
  </div>

  <TripList {viewMode} />
</div>