<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CreateExpense, ExpenseCategory } from '$lib/types/expense';
  import { ExpenseCategoryEnum } from '$lib/types/expense';
  import { expenseStore } from '$lib/stores/expenses';
  import { clsx } from 'clsx';

  export let expense: Partial<CreateExpense> = {
    amount: 0,
    currency: 'USD',
    date: new Date(),
    category: 'Other',
    description: '',
    location: '',
    vendor: '',
    userId: ''
  };

  export let isEditing = false;

  const dispatch = createEventDispatcher();
  let isSubmitting = false;
  let errors: Record<string, string> = {};

  const categories = Object.values(ExpenseCategoryEnum.enum);
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

  function validateForm(): boolean {
    errors = {};

    if (!expense.amount || expense.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!expense.date) {
      errors.date = 'Date is required';
    }

    if (!expense.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (!expense.category) {
      errors.category = 'Category is required';
    }

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;
    try {
      if (isEditing && expense.id) {
        const updatedExpense = await expenseStore.updateExpense({
          ...expense as CreateExpense,
          id: expense.id
        });
        dispatch('success', { expense: updatedExpense });
      } else {
        const newExpense = await expenseStore.createExpense(expense as CreateExpense);
        dispatch('success', { expense: newExpense });
      }
    } catch (error) {
      dispatch('error', { error });
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Amount and Currency -->
    <div class="flex space-x-2">
      <div class="flex-1">
        <label for="amount" class="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div class="mt-1">
          <input
            type="number"
            step="0.01"
            min="0"
            id="amount"
            bind:value={expense.amount}
            class={clsx(
              "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
              errors.amount && "border-red-300"
            )}
          />
        </div>
        {#if errors.amount}
          <p class="mt-1 text-sm text-red-600">{errors.amount}</p>
        {/if}
      </div>
      <div class="w-32">
        <label for="currency" class="block text-sm font-medium text-gray-700">
          Currency
        </label>
        <div class="mt-1">
          <select
            id="currency"
            bind:value={expense.currency}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {#each currencies as currency}
              <option value={currency}>{currency}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Date -->
    <div>
      <label for="date" class="block text-sm font-medium text-gray-700">
        Date
      </label>
      <div class="mt-1">
        <input
          type="date"
          id="date"
          bind:value={expense.date}
          class={clsx(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
            errors.date && "border-red-300"
          )}
        />
      </div>
      {#if errors.date}
        <p class="mt-1 text-sm text-red-600">{errors.date}</p>
      {/if}
    </div>

    <!-- Category -->
    <div>
      <label for="category" class="block text-sm font-medium text-gray-700">
        Category
      </label>
      <div class="mt-1">
        <select
          id="category"
          bind:value={expense.category}
          class={clsx(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
            errors.category && "border-red-300"
          )}
        >
          {#each categories as category}
            <option value={category}>{category}</option>
          {/each}
        </select>
      </div>
      {#if errors.category}
        <p class="mt-1 text-sm text-red-600">{errors.category}</p>
      {/if}
    </div>

    <!-- Description -->
    <div class="sm:col-span-2">
      <label for="description" class="block text-sm font-medium text-gray-700">
        Description
      </label>
      <div class="mt-1">
        <input
          type="text"
          id="description"
          bind:value={expense.description}
          class={clsx(
            "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm",
            errors.description && "border-red-300"
          )}
        />
      </div>
      {#if errors.description}
        <p class="mt-1 text-sm text-red-600">{errors.description}</p>
      {/if}
    </div>

    <!-- Location -->
    <div>
      <label for="location" class="block text-sm font-medium text-gray-700">
        Location
      </label>
      <div class="mt-1">
        <input
          type="text"
          id="location"
          bind:value={expense.location}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>

    <!-- Vendor -->
    <div>
      <label for="vendor" class="block text-sm font-medium text-gray-700">
        Vendor
      </label>
      <div class="mt-1">
        <input
          type="text"
          id="vendor"
          bind:value={expense.vendor}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
    </div>
  </div>

  <!-- Form Actions -->
  <div class="flex justify-end space-x-3">
    <button
      type="button"
      on:click={handleCancel}
      class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting}
      class="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {#if isSubmitting}
        <span class="inline-block animate-spin">⌛</span>
      {:else}
        {isEditing ? 'Update' : 'Create'} Expense
      {/if}
    </button>
  </div>
</form>