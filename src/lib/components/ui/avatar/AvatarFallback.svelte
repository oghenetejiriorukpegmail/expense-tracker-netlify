<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props
  export let delayMs = 600;
  
  // Class handling
  let className = "";
  export { className as class };
  
  // State
  let isShown = delayMs === 0;
  
  onMount(() => {
    if (delayMs > 0) {
      const timeout = setTimeout(() => {
        isShown = true;
      }, delayMs);
      
      return () => clearTimeout(timeout);
    }
  });
</script>

{#if isShown}
  <div class={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className}`}>
    <slot />
  </div>
{/if}