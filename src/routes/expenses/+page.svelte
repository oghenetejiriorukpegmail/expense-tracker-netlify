<script lang="ts">
  import type { PageData } from './$types';
  import ExpenseTable from '$lib/components/tables/ExpenseTable.svelte';
  import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte'; // Import ConfirmationModal
  import ImageViewerModal from '$lib/components/modals/ImageViewerModal.svelte'; // Import ImageViewerModal
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;

  $: ({ expenses, error, loading } = data);

  // State for modals
  let showReceiptViewer = false;
  let receiptImageUrl: string | null = null;
  let showDeleteConfirm = false;
  let expenseToDeleteId: number | null = null;
  let isDeleting = false;
  let deleteError: string | null = null;

  // Event Handlers
  function handleEdit(event: CustomEvent<number>) {
    const expenseId = event.detail;
    goto(`/expenses/${expenseId}/edit`); // Navigate to edit page
  }

  function handleDeleteRequest(event: CustomEvent<number>) {
    expenseToDeleteId = event.detail;
    deleteError = null;
    showDeleteConfirm = true;
  }

  async function confirmDelete() {
    if (expenseToDeleteId === null) return;
    isDeleting = true;
    deleteError = null;
    try {
      await api.delete(`/expenses/${expenseToDeleteId}`);
      await invalidateAll(); // Refresh data
      showDeleteConfirm = false; // Close modal on success
    } catch (err) {
      console.error('Failed to delete expense:', err);
      deleteError = err instanceof Error ? err.message : 'Could not delete expense.';
    } finally {
      isDeleting = false;
      // Keep modal open on error to show message
      if (!deleteError) {
          expenseToDeleteId = null;
      }
    }
  }

   function cancelDelete() {
       showDeleteConfirm = false;
       expenseToDeleteId = null;
       deleteError = null;
   }

  function handleViewReceipt(event: CustomEvent<string>) {
    receiptImageUrl = event.detail;
    showReceiptViewer = true;
  }

  function closeReceiptViewer() {
      showReceiptViewer = false;
      receiptImageUrl = null;
  }

</script>

<div class="p-4 md:p-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold">Expenses</h1>
    <div>
       <!-- TODO: Add Export Button -->
       <a href="/expenses/new" class="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
         Add Expense
       </a>
    </div>
  </div>

  {#if loading}
    <p>Loading expenses...</p> <!-- TODO: Add better loading skeleton -->
  {:else if error}
    <div class="text-red-600 bg-red-100 border border-red-400 p-4 rounded">
      <h2 class="font-bold text-lg mb-2">Error Loading Expenses</h2>
      <p>{error}</p>
    </div>
  {:else if expenses && expenses.length > 0}
    <div class="bg-white rounded shadow overflow-hidden">
      <ExpenseTable
        {expenses}
        on:edit={handleEdit}
        on:delete={handleDeleteRequest}
        on:viewReceipt={handleViewReceipt}
      />
    </div>
  {:else}
    <div class="bg-white p-6 rounded shadow text-center">
      <p class="text-gray-600 mb-4">No expenses found.</p>
      <a href="/expenses/new" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Your First Expense
      </a>
    </div>
  {/if}
</div>

<!-- Use the actual modal components -->
<ImageViewerModal
  bind:open={showReceiptViewer}
  imageUrl={receiptImageUrl}
  title="Receipt"
  altText="Expense Receipt"
  on:close={closeReceiptViewer}
/>

<ConfirmationModal
  bind:open={showDeleteConfirm}
  title="Delete Expense"
  description="Are you sure you want to delete this expense? This action cannot be undone."
  confirmText="Delete"
  bind:isProcessing={isDeleting}
  error={deleteError}
  on:confirm={confirmDelete}
  on:cancel={cancelDelete}
/>