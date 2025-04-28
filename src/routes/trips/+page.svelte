<script lang="ts">
  import type { PageData } from './$types';
  import { format, parseISO } from 'date-fns';
  import { goto } from '$app/navigation';
  // Assuming shadcn-svelte components
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { DateRangePicker } from '$lib/components/ui/date-range-picker';

  export let data: PageData;

  $: ({ trips, error, loading, filters } = data);
  
  // Date range state
  let startDate = filters?.startDate || null;
  let endDate = filters?.endDate || null;
  
  // Apply filters
  function applyFilters() {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.set('startDate', startDate.toISOString());
    }
    
    if (endDate) {
      params.set('endDate', endDate.toISOString());
    }
    
    goto(`?${params.toString()}`);
  }
  
  // Clear filters
  function clearFilters() {
    startDate = null;
    endDate = null;
    goto('?');
  }

  function formatTripDate(dateString: string | Date | undefined): string {
      if (!dateString) return 'N/A';
      try {
          const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
          return format(date, "MMM d, yyyy");
      } catch (e) {
          return "Invalid Date";
      }
  }

   function formatCurrency(amount: string | number | null | undefined, currency: string = 'USD'): string {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (numAmount === null || numAmount === undefined || isNaN(numAmount)) return 'N/A';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(numAmount);
   }

   function getStatusColor(status: string | null | undefined): string {
       switch (status?.toLowerCase()) {
           case 'planned': return 'bg-blue-100 text-blue-800';
           case 'inprogress': return 'bg-yellow-100 text-yellow-800';
           case 'completed': return 'bg-green-100 text-green-800';
           case 'cancelled': return 'bg-red-100 text-red-800';
           default: return 'bg-gray-100 text-gray-800';
       }
   }

</script>

<div class="p-4 md:p-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold">Trips</h1>
    <a href="/trips/new" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      Add Trip
    </a>
  </div>
  
  <!-- Filter Section -->
  <div class="bg-white p-4 rounded-lg shadow mb-6">
    <h2 class="text-lg font-medium mb-3">Filter Trips</h2>
    <div class="flex flex-col md:flex-row gap-4 items-end">
      <div class="w-full md:w-1/2">
        <DateRangePicker
          bind:startDate
          bind:endDate
          placeholder="Select date range"
        />
      </div>
      <div class="flex gap-2">
        <Button on:click={applyFilters} variant="default">Apply Filters</Button>
        <Button on:click={clearFilters} variant="outline">Clear</Button>
      </div>
    </div>
    {#if startDate && endDate}
      <div class="mt-2 text-sm text-gray-600">
        Showing trips between {format(startDate, "MMM d, yyyy")} and {format(endDate, "MMM d, yyyy")}
      </div>
    {/if}
  </div>

  {#if loading}
    <p>Loading trips...</p> <!-- TODO: Add loading skeleton -->
  {:else if error}
    <div class="text-red-600 bg-red-100 border border-red-400 p-4 rounded">
      <h2 class="font-bold text-lg mb-2">Error Loading Trips</h2>
      <p>{error.message || 'An unknown error occurred.'}</p>
    </div>
  {:else if trips && trips.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each trips as trip (trip.id)}
        <a href="/trips/{trip.id}" class="block hover:shadow-lg transition-shadow duration-200">
          <Card>
            <CardHeader>
              <div class="flex justify-between items-start">
                 <CardTitle class="text-lg">{trip.name}</CardTitle>
                 <Badge class="{getStatusColor(trip.status)} px-2.5 py-0.5 text-xs font-semibold">{trip.status || 'Unknown'}</Badge>
              </div>
              {#if trip.description}
                <CardDescription class="text-sm pt-1">{trip.description}</CardDescription>
              {/if}
            </CardHeader>
            <CardContent class="text-sm space-y-2">
               <p><strong>Dates:</strong> {formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}</p>
               {#if trip.location}<p><strong>Location:</strong> {trip.location}</p>{/if}
               {#if trip.budget}<p><strong>Budget:</strong> {formatCurrency(trip.budget, trip.currency)}</p>{/if}
               <p><strong>Expenses:</strong> {formatCurrency(trip.totalExpenses, trip.currency)} ({trip.expenseCount} items)</p>
            </CardContent>
             <CardFooter class="text-xs text-gray-500">
                Created: {formatTripDate(trip.createdAt)}
             </CardFooter>
          </Card>
        </a>
      {/each}
    </div>
  {:else}
    <div class="bg-white p-6 rounded shadow text-center">
      <p class="text-gray-600 mb-4">No trips found.</p>
      <a href="/trips/new" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Your First Trip
      </a>
    </div>
  {/if}
</div>