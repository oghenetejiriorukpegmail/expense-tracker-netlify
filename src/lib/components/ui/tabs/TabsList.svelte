<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute list classes
  $: listClasses = [
    "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
    className
  ].join(" ");
</script>

<div class={listClasses} role="tablist">
  <slot />
</div>