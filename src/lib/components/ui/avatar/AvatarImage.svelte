<script lang="ts">
  // Props
  export let src: string | undefined = undefined;
  export let alt: string = "";
  
  // Class handling
  let className = "";
  export { className as class };
  
  // State
  let isLoaded = false;
  let hasError = false;
  
  function onLoad() {
    isLoaded = true;
  }
  
  function onError() {
    hasError = true;
  }
</script>

{#if src && !hasError}
  <img
    {src}
    {alt}
    class={`aspect-square h-full w-full object-cover ${className}`}
    on:load={onLoad}
    on:error={onError}
  />
{/if}

<slot {isLoaded} />