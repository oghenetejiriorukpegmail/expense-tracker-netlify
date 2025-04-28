<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ExpenseFilter } from '$lib/types/expense';
  import { ExpenseCategoryEnum } from '$lib/types/expense';

  export let searchInput = '';
  export let selectedCategory = '';
  export let startDate: string | undefined;
  export let endDate: string | undefined;
  export let minAmount: number | undefined;
  export let maxAmount: number | undefined;

  const dispatch = createEventDispatcher<{
    filter: { filters: Partial<ExpenseFilter> };
    reset: void;
  }>();

  const categories = ['All', ...Object.values(ExpenseCategoryEnum.enum)];

  function applyFilters() {
    const filters: Partial<ExpenseFilter> = {
      page: 1 // Reset to first page when filtering
    };

    if (searchInput) {
      filters.search = searchInput;
    }

    if (selectedCategory && selectedCategory !== 'All') {
      filters.category = selectedCategory as ExpenseFilter['category'];
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    if (minAmount !== undefined) {
      filters.minAmount = minAmount;
    }

    if (maxAmount !== undefined) {
      filters.maxAmount = maxAmount;
    }

    dispatch('filter', { filters });
  }

  function resetFilters() {
    searchInput = '';
    selectedCategory = '';
    startDate = undefined;
    endDate = undefined;
    minAmount = undefined;
    maxAmount = undefined;
    dispatch('reset');
  }
</script>

<div class="rounded-lg bg-white p-4 shadow">
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <!-- Search -->
    <div>
      <label for="search" class="block text-sm font-medium text-gray-700">Search</label>
      <input
        type="text"
        id="search"
        bind:value={searchInput}
        placeholder="Search expenses..."
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      />
    </div>

    <!-- Category -->
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
      <select
        id="category"
        bind:value={selectedCategory}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {#each categories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
    </div>

    <!-- Date Range -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label for="startDate" class="block text-sm font-medium text-gray-700">From</label>
        <input
          type="date"
          id="startDate"
          bind:value={startDate}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label for="endDate" class="block text-sm font-medium text-gray-700">To</label>
        <input
          type="date"
          id="endDate"
          bind:value={endDate}
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>

    <!-- Amount Range -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label for="minAmount" class="block text-sm font-medium text-gray-700">Min Amount</label>
        <input
          type="number"
          id="minAmount"
          bind:value={minAmount}
          min="0"
          step="0.01"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label for="maxAmount" class="block text-sm font-medium text-gray-700">Max Amount</label>
        <input
          type="number"
          id="maxAmount"
          bind:value={maxAmount}
          min="0"
          step="0.01"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>
  </div>

  <!-- Filter Actions -->
  <div class="mt-4 flex justify-end space-x-3">
    <button
      type="button"
      on:click={resetFilters}
      class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >
      Reset
    </button>
    <button
      type="button"
      on:click={applyFilters}
      class="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
    >
      Apply Filters
    </button>
  </div>
</div>