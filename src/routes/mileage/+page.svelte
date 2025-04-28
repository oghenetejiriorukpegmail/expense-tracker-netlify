<script lang="ts">
  import type { PageData } from './$types';
  import MileageLogTable from '$lib/components/tables/MileageLogTable.svelte'; // Import the table component
  import ConfirmationModal from '$lib/components/modals/ConfirmationModal.svelte'; // Import ConfirmationModal
  import ImageViewerModal from '$lib/components/modals/ImageViewerModal.svelte'; // Import ImageViewerModal
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;

  $: ({ mileageLogs, error, loading } = data);

  // State for modals
  let showImageViewer = false;
  let imageUrlToView: string | null = null;
  let showDeleteConfirm = false;
  let logToDeleteId: number | null = null;
  let isDeleting = false;
  let deleteError: string | null = null;

  // Event Handlers
  function handleEdit(event: CustomEvent<number>) {
    const logId = event.detail;
    goto(`/mileage/${logId}/edit`); // Navigate to edit page
  }

  function handleDeleteRequest(event: CustomEvent<number>) {
    logToDeleteId = event.detail;
    deleteError = null;
    showDeleteConfirm = true;
  }

  async function confirmDelete() {
    if (logToDeleteId === null) return;
    isDeleting = true;
    deleteError = null;
    try {
      await api.delete(`/mileage-logs/${logToDeleteId}`);
      await invalidateAll(); // Refresh data
      showDeleteConfirm = false; // Close modal on success
    } catch (err) {
      console.error('Failed to delete mileage log:', err);
      deleteError = err instanceof Error ? err.message : 'Could not delete mileage log.';
    } finally {
      isDeleting = false;
      if (!deleteError) {
          logToDeleteId = null;
      }
    }
  }

   function cancelDelete() {
       showDeleteConfirm = false;
       logToDeleteId = null;
       deleteError = null;
   }

  function handleViewImage(event: CustomEvent<string>) {
    imageUrlToView = event.detail;
    showImageViewer = true;
  }

   function closeImageViewer() {
      showImageViewer = false;
      imageUrlToView = null;
  }

</script>

<div class="p-4 md:p-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold">Mileage Logs</h1>
    <div>
      <!-- TODO: Add Export Button -->
      <a href="/mileage/new" class="ml-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Mileage Log
      </a>
    </div>
  </div>

  {#if loading}
    <p>Loading mileage logs...</p> <!-- TODO: Add better loading skeleton -->
  {:else if error}
    <div class="text-red-600 bg-red-100 border border-red-400 p-4 rounded">
      <h2 class="font-bold text-lg mb-2">Error Loading Mileage Logs</h2>
      <p>{error.message || 'An unknown error occurred.'}</p>
    </div>
  {:else if mileageLogs && mileageLogs.length > 0}
    <div class="bg-white rounded shadow overflow-hidden">
      <MileageLogTable
        logs={mileageLogs}
        on:edit={handleEdit}
        on:delete={handleDeleteRequest}
        on:viewImage={handleViewImage}
      />
    </div>
  {:else}
    <div class="bg-white p-6 rounded shadow text-center">
      <p class="text-gray-600 mb-4">No mileage logs found.</p>
      <a href="/mileage/new" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Your First Mileage Log
      </a>
    </div>
  {/if}
</div>

<!-- Use the actual modal components -->
<ImageViewerModal
  bind:open={showImageViewer}
  imageUrl={imageUrlToView}
  title="Odometer Image"
  altText="Odometer Reading"
  on:close={closeImageViewer}
/>

<ConfirmationModal
  bind:open={showDeleteConfirm}
  title="Delete Mileage Log"
  description="Are you sure you want to delete this mileage log? This action cannot be undone."
  confirmText="Delete"
  bind:isProcessing={isDeleting}
  error={deleteError}
  on:confirm={confirmDelete}
  on:cancel={cancelDelete}
/>