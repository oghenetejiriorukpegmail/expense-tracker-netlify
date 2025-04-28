<script lang="ts">
  import { onMount } from 'svelte';
  import { expenseStore, expenses, isLoading, totalCount, filter } from '$lib/stores/expenses';
  import type { ExpenseFilter, Expense } from '$lib/types/expense';
  import { ExpenseCategoryEnum } from '$lib/types/expense';
  import { clsx } from 'clsx';

  let searchInput = '';
  let selectedCategory = '';
  let startDate: string | undefined;
  let endDate: string | undefined;
  let minAmount: number | undefined;
  let maxAmount: number | undefined;

  const categories = ['All', ...Object.values(ExpenseCategoryEnum.enum)];

  // Format currency based on locale
  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  // Format date for display
  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-US').format(date);
  }

  // Handle sorting
  function handleSort(column: ExpenseFilter['sortBy']) {
    const currentFilter = $filter;
    const newOrder = currentFilter.sortBy === column && currentFilter.sortOrder === 'asc' ? 'desc' : 'asc';
    expenseStore.setFilter({
      sortBy: column,
      sortOrder: newOrder
    });
  }

  // Handle pagination
  function handlePageChange(newPage: number) {
    expenseStore.setFilter({ page: newPage });
  }

  // Apply filters
  function applyFilters() {
    const newFilter: Partial<ExpenseFilter> = {
      page: 1 // Reset to first page when filtering
    };

    if (searchInput) {
      newFilter.search = searchInput;
    }

    if (selectedCategory && selectedCategory !== 'All') {
      newFilter.category = selectedCategory as ExpenseFilter['category'];
    }

    if (startDate) {
      newFilter.startDate = new Date(startDate);
    }

    if (endDate) {
      newFilter.endDate = new Date(endDate);
    }

    if (minAmount !== undefined) {
      newFilter.minAmount = minAmount;
    }

    if (maxAmount !== undefined) {
      newFilter.maxAmount = maxAmount;
    }

    expenseStore.setFilter(newFilter);
  }

  // Reset filters
  function resetFilters() {
    searchInput = '';
    selectedCategory = '';
    startDate = undefined;
    endDate = undefined;
    minAmount = undefined;
    maxAmount = undefined;
    expenseStore.setFilter({
      page: 1,
      search: undefined,
      category: undefined,
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined
    });
  }

  // Handle expense deletion
  async function handleDelete(expense: Expense) {
    if (confirm(`Are you sure you want to delete expense "${expense.description}"?`)) {
      await expenseStore.deleteExpense(expense.id!);
    }
  }

  // Handle expense edit
  function handleEdit(expense: Expense) {
    // Dispatch edit event to parent
    dispatch('edit', { expense });
  }

  onMount(() => {
    expenseStore.fetchExpenses();
  });
</script>

<!-- Filters -->
<div class="mb-6 rounded-lg bg-white p-4 shadow">
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

<!-- Expense Table -->
<div class="overflow-hidden rounded-lg bg-white shadow">
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            <button
              class="flex items-center space-x-1"
              on:click={() => handleSort('date')}
            >
              <span>Date</span>
              {#if $filter.sortBy === 'date'}
                <span class="text-blue-500">
                  {$filter.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              {/if}
            </button>
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            <button
              class="flex items-center space-x-1"
              on:click={() => handleSort('amount')}
            >
              <span>Amount</span>
              {#if $filter.sortBy === 'amount'}
                <span class="text-blue-500">
                  {$filter.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              {/if}
            </button>
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            <button
              class="flex items-center space-x-1"
              on:click={() => handleSort('category')}
            >
              <span>Category</span>
              {#if $filter.sortBy === 'category'}
                <span class="text-blue-500">
                  {$filter.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              {/if}
            </button>
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Description
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Location
          </th>
          <th
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Vendor
          </th>
          <th scope="col" class="relative px-6 py-3">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        {#if $isLoading}
          <tr>
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
              Loading expenses...
            </td>
          </tr>
        {:else if $expenses.length === 0}
          <tr>
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
              No expenses found
            </td>
          </tr>
        {:else}
          {#each $expenses as expense}
            <tr>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatDate(expense.date)}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatCurrency(expense.amount, expense.currency)}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {expense.category}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {expense.description}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {expense.location || '-'}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {expense.vendor || '-'}
              </td>
              <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <button
                  on:click={() => handleEdit(expense)}
                  class="text-blue-600 hover:text-blue-900"
                >
                  Edit
                </button>
                <button
                  on:click={() => handleDelete(expense)}
                  class="ml-3 text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  {#if $totalCount > $filter.limit}
    <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div class="flex flex-1 justify-between sm:hidden">
        <button
          on:click={() => handlePageChange($filter.page - 1)}
          disabled={$filter.page === 1}
          class={clsx(
            "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700",
            $filter.page === 1
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-50"
          )}
        >
          Previous
        </button>
        <button
          on:click={() => handlePageChange($filter.page + 1)}
          disabled={$filter.page * $filter.limit >= $totalCount}
          class={clsx(
            "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700",
            $filter.page * $filter.limit >= $totalCount
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-gray-50"
          )}
        >
          Next
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing
            <span class="font-medium">{($filter.page - 1) * $filter.limit + 1}</span>
            to
            <span class="font-medium">
              {Math.min($filter.page * $filter.limit, $totalCount)}
            </span>
            of
            <span class="font-medium">{$totalCount}</span>
            results
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              on:click={() => handlePageChange($filter.page - 1)}
              disabled={$filter.page === 1}
              class={clsx(
                "relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500",
                $filter.page === 1
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-50"
              )}
            >
              Previous
            </button>
            {#each Array(Math.ceil($totalCount / $filter.limit)) as _, i}
              <button
                on:click={() => handlePageChange(i + 1)}
                class={clsx(
                  "relative inline-flex items-center border border-gray-300 px-4 py-2 text-sm font-medium",
                  $filter.page === i + 1
                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                )}
              >
                {i + 1}
              </button>
            {/each}
            <button
              on:click={() => handlePageChange($filter.page + 1)}
              disabled={$filter.page * $filter.limit >= $totalCount}
              class={clsx(
                "relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500",
                $filter.page * $filter.limit >= $totalCount
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-50"
              )}
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  {/if}
</div>