<script lang="ts">
  import type { PageData } from './$types';
  import { format, parseISO } from 'date-fns';
  import ExpenseTable from '$lib/components/tables/ExpenseTable.svelte';
  import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte'; // Import ConfirmationModal
  import ImageViewerModal from '$lib/components/modals/ImageViewerModal.svelte'; // Import ImageViewerModal
  // Assuming shadcn-svelte components
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { invalidateAll } from '$app/navigation';
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation'; // Import goto

  export let data: PageData;

  $: ({ trip, expenses, error, loading } = data);

  // --- Formatting Helpers ---
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

   // --- Event Handlers for Expense Table ---
   let showReceiptViewer = false;
   let receiptImageUrl: string | null = null;
   let showDeleteConfirm = false;
   let expenseToDeleteId: number | null = null;
   let isDeleting = false;
   let deleteError: string | null = null;

   function handleEditExpense(event: CustomEvent<number>) {
     const expenseId = event.detail;
     goto(`/expenses/${expenseId}/edit`); // Use goto for navigation
   }

   function handleDeleteExpenseRequest(event: CustomEvent<number>) {
     expenseToDeleteId = event.detail;
     deleteError = null;
     showDeleteConfirm = true;
   }

   async function confirmDeleteExpense() {
     if (expenseToDeleteId === null) return;
     isDeleting = true;
     deleteError = null;
     try {
       await api.delete(`/expenses/${expenseToDeleteId}`);
       await invalidateAll(); // Refetch trip and expense data
       showDeleteConfirm = false; // Close modal on success
     } catch (err) {
       console.error('Failed to delete expense:', err);
       deleteError = err instanceof Error ? err.message : 'Could not delete expense.';
     } finally {
       isDeleting = false;
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

<div class="p-4 md:p-8 space-y-6">
  {#if loading}
    <p>Loading trip details...</p>
  {:else if error}
    <div class="text-red-600 bg-red-100 border border-red-400 p-4 rounded">
      <h2 class="font-bold text-lg mb-2">Error Loading Trip</h2>
      <p>{error.message || 'An unknown error occurred.'}</p>
      <a href="/trips" class="text-blue-600 hover:underline mt-2 block">Back to Trips</a>
    </div>
  {:else if trip}
    <!-- Trip Details Card -->
    <Card>
      <CardHeader>
        <div class="flex justify-between items-start">
          <div>
            <CardTitle class="text-2xl">{trip.name}</CardTitle>
            {#if trip.description}
              <CardDescription class="text-md pt-1">{trip.description}</CardDescription>
            {/if}
          </div>
          <div class="flex items-center space-x-2">
             <Badge class="{getStatusColor(trip.status)} px-2.5 py-0.5 text-xs font-semibold">{trip.status || 'Unknown'}</Badge>
             <a href="/trips/{trip.id}/edit">
                <Button variant="outline" size="sm">Edit Trip</Button>
             </a>
          </div>
        </div>
      </CardHeader>
      <CardContent class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div><strong>Dates:</strong> {formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}</div>
        {#if trip.location}<div><strong>Location:</strong> {trip.location}</div>{/if}
        {#if trip.budget}<div><strong>Budget:</strong> {formatCurrency(trip.budget, trip.currency)}</div>{/if}
        <div><strong>Total Expenses:</strong> {formatCurrency(trip.totalExpenses, trip.currency)}</div>
        <div><strong>Expense Count:</strong> {trip.expenseCount}</div>
        {#if trip.tags && trip.tags.length > 0}
          <div class="md:col-span-3">
             <strong>Tags:</strong>
             {#each trip.tags as tag}
                <Badge variant="secondary" class="ml-1">{tag}</Badge>
             {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Expenses Table -->
    <div class="mt-6">
       <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Expenses for this Trip</h2>
          <a href="/expenses/new?tripId={trip.id}&tripName={encodeURIComponent(trip.name)}"
             class="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700">
             Add Expense to Trip
          </a>
       </div>
       {#if expenses && expenses.length > 0}
          <div class="bg-white rounded shadow overflow-hidden">
             <ExpenseTable
                {expenses}
                on:edit={handleEditExpense}
                on:delete={handleDeleteExpenseRequest}
                on:viewReceipt={handleViewReceipt}
             />
          </div>
       {:else}
          <div class="bg-white p-6 rounded shadow text-center">
             <p class="text-gray-600 mb-4">No expenses recorded for this trip yet.</p>
             <a href="/expenses/new?tripId={trip.id}&tripName={encodeURIComponent(trip.name)}"
                class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Add First Expense
             </a>
          </div>
       {/if}
    </div>

  {:else}
    <p>Trip data not available.</p>
     <a href="/trips" class="text-blue-600 hover:underline mt-2 block">Back to Trips</a>
  {/if}
</div>

<!-- Modals -->
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
  on:confirm={confirmDeleteExpense}
  on:cancel={cancelDelete}
/>