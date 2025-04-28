<script lang="ts">
  import { ExpenseList, ExpenseForm } from '$lib/components/expenses';
  import type { Expense } from '$lib/types/expense';

  let showForm = false;
  let editingExpense: Expense | null = null;

  function handleEdit(event: CustomEvent<{ expense: Expense }>) {
    editingExpense = event.detail.expense;
    showForm = true;
  }

  function handleSuccess() {
    showForm = false;
    editingExpense = null;
  }

  function handleCancel() {
    showForm = false;
    editingExpense = null;
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-bold text-gray-900">Expenses</h1>
    <button
      on:click={() => {
        editingExpense = null;
        showForm = true;
      }}
      class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Add Expense
    </button>
  </div>

  {#if showForm}
    <div class="mb-8 rounded-lg bg-white p-6 shadow">
      <h2 class="mb-4 text-lg font-medium text-gray-900">
        {editingExpense ? 'Edit' : 'Add'} Expense
      </h2>
      <ExpenseForm
        expense={editingExpense ?? undefined}
        isEditing={!!editingExpense}
        on:success={handleSuccess}
        on:cancel={handleCancel}
      />
    </div>
  {/if}

  <ExpenseList on:edit={handleEdit} />
</div>