<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '$lib/components/ui/dialog'; // Using Dialog for modal structure
  import { AlertCircle, Loader2 } from 'lucide-svelte';

  export let open = false; // Controlled by parent
  export let title = "Confirm Action";
  export let description = "Are you sure you want to proceed? This action cannot be undone.";
  export let confirmText = "Confirm";
  export let cancelText = "Cancel";
  export let confirmVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'destructive';
  export let isProcessing = false; // To show loading state on confirm button
  export let error: string | null = null; // To display errors within the modal

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();

  function handleConfirm() {
    if (!isProcessing) {
      dispatch('confirm');
    }
  }

  function handleCancel() {
      if (!isProcessing) {
         dispatch('cancel');
      }
  }

  // Close modal if open prop changes externally
  function handleOpenChange(newOpenState: boolean) {
      if (!newOpenState && open) {
          handleCancel(); // Dispatch cancel if closed externally
      }
      // Note: Direct binding `bind:open` might be simpler depending on usage pattern
  }

</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
  <DialogContent class="sm:max-w-[425px]" onEscapeKeyDown={handleCancel} onInteractOutside={(e) => { if (!isProcessing) e.preventDefault(); handleCancel(); }}>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        {description}
      </DialogDescription>
    </DialogHeader>
    {#if error}
       <div class="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center">
          <AlertCircle class="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
       </div>
    {/if}
    <DialogFooter>
      <Button variant="outline" on:click={handleCancel} disabled={isProcessing}>{cancelText}</Button>
      <Button variant={confirmVariant} on:click={handleConfirm} disabled={isProcessing}>
        {#if isProcessing}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Processing...
        {:else}
          {confirmText}
        {/if}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>