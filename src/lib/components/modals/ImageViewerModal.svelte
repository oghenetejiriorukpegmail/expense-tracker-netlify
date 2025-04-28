<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
  import { X } from 'lucide-svelte';

  export let open = false; // Controlled by parent
  export let imageUrl: string | null = null;
  export let altText = "Image Viewer";
  export let title = "Image Viewer";

  const dispatch = createEventDispatcher<{ close: void }>();

  function handleClose() {
      dispatch('close');
  }

  // Close modal if open prop changes externally
  function handleOpenChange(newOpenState: boolean) {
      if (!newOpenState && open) {
          handleClose();
      }
  }

</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
  <!-- Use w-auto and max-w/max-h for flexible sizing based on image -->
  <DialogContent class="sm:max-w-3xl w-auto max-h-[90vh] p-2 sm:p-4 flex flex-col" onEscapeKeyDown={handleClose} onInteractOutside={handleClose}>
    <DialogHeader class="flex-shrink-0">
      <DialogTitle class="flex justify-between items-center">
        <span>{title}</span>
        <Button variant="ghost" size="icon" class="h-7 w-7" on:click={handleClose}>
           <X class="h-4 w-4" />
        </Button>
      </DialogTitle>
    </DialogHeader>
    <div class="flex-grow overflow-auto flex items-center justify-center p-2">
      {#if imageUrl}
        <img src={imageUrl} alt={altText} class="max-w-full max-h-full object-contain"/>
      {:else}
        <p class="text-muted-foreground">No image URL provided.</p>
      {/if}
    </div>
    <!-- Optional Footer -->
    <!-- <DialogFooter class="flex-shrink-0">
      <Button variant="outline" on:click={handleClose}>Close</Button>
    </DialogFooter> -->
  </DialogContent>
</Dialog>