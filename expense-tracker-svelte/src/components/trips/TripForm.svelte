<script lang="ts">
import { tripStore } from '$lib/stores/tripStore';
import type { Trip, CreateTrip } from '$lib/types/trip';
import { onMount } from 'svelte';

export let trip: Trip | null = null;
export let onSubmit: (trip: Trip) => void = () => {};
export let onCancel: () => void = () => {};

let loading = false;
let error: string | null = null;

let form: CreateTrip = {
  title: '',
  description: '',
  startDate: new Date(),
  endDate: new Date(),
  status: 'Planned',
  budget: undefined,
  currency: 'USD',
  location: '',
  tags: [],
  userId: ''
};

let tagInput = '';
let currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

onMount(() => {
  if (trip) {
    form = {
      ...trip,
      startDate: new Date(trip.startDate),
      endDate: new Date(trip.endDate),
      tags: trip.tags || []
    };
  }
});

function addTag() {
  if (tagInput.trim()) {
    form.tags = [...(form.tags || []), tagInput.trim()];
    tagInput = '';
  }
}

function removeTag(tag: string) {
  form.tags = form.tags?.filter(t => t !== tag) || [];
}

function validateForm(): string | null {
  if (!form.title.trim()) {
    return 'Title is required';
  }
  
  if (!form.startDate || !form.endDate) {
    return 'Start and end dates are required';
  }
  
  if (new Date(form.endDate) < new Date(form.startDate)) {
    return 'End date must be after start date';
  }
  
  if (form.budget !== undefined && form.budget < 0) {
    return 'Budget must be a positive number';
  }
  
  return null;
}

async function handleSubmit() {
  const validationError = validateForm();
  if (validationError) {
    error = validationError;
    return;
  }

  loading = true;
  error = null;

  try {
    if (trip) {
      const updatedTrip = await tripStore.updateTrip(trip.id, form);
      onSubmit(updatedTrip);
    } else {
      const newTrip = await tripStore.createTrip(form);
      onSubmit(newTrip);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to save trip';
  } finally {
    loading = false;
  }
}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <span class="block sm:inline">{error}</span>
    </div>
  {/if}

  <div>
    <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
    <input
      type="text"
      id="title"
      bind:value={form.title}
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
      required
    />
  </div>

  <div>
    <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
    <textarea
      id="description"
      bind:value={form.description}
      rows="3"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
    ></textarea>
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <div>
      <label for="startDate" class="block text-sm font-medium text-gray-700">Start Date</label>
      <input
        type="date"
        id="startDate"
        bind:value={form.startDate}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        required
      />
    </div>

    <div>
      <label for="endDate" class="block text-sm font-medium text-gray-700">End Date</label>
      <input
        type="date"
        id="endDate"
        bind:value={form.endDate}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        required
      />
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <div>
      <label for="budget" class="block text-sm font-medium text-gray-700">Budget</label>
      <input
        type="number"
        id="budget"
        bind:value={form.budget}
        min="0"
        step="0.01"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
      />
    </div>

    <div>
      <label for="currency" class="block text-sm font-medium text-gray-700">Currency</label>
      <select
        id="currency"
        bind:value={form.currency}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
      >
        {#each currencies as currency}
          <option value={currency}>{currency}</option>
        {/each}
      </select>
    </div>
  </div>

  <div>
    <label for="location" class="block text-sm font-medium text-gray-700">Location</label>
    <input
      type="text"
      id="location"
      bind:value={form.location}
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
    />
  </div>

  <div>
    <label class="block text-sm font-medium text-gray-700">Tags</label>
    <div class="mt-1 flex rounded-md shadow-sm">
      <input
        type="text"
        bind:value={tagInput}
        placeholder="Add a tag"
        class="flex-1 rounded-none rounded-l-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
        on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
      />
      <button
        type="button"
        class="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm"
        on:click={addTag}
      >
        Add
      </button>
    </div>
    {#if form.tags && form.tags.length > 0}
      <div class="mt-2 flex flex-wrap gap-2">
        {#each form.tags as tag}
          <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {tag}
            <button
              type="button"
              class="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500"
              on:click={() => removeTag(tag)}
            >
              <span class="sr-only">Remove tag</span>
              ×
            </button>
          </span>
        {/each}
      </div>
    {/if}
  </div>

  <div class="flex justify-end space-x-3">
    <button
      type="button"
      on:click={onCancel}
      class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      disabled={loading}
    >
      Cancel
    </button>
    <button
      type="submit"
      class="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      disabled={loading}
    >
      {loading ? 'Saving...' : trip ? 'Update Trip' : 'Create Trip'}
    </button>
  </div>
</form>