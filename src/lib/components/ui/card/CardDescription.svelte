<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute description classes
  $: descriptionClasses = [
    "text-sm text-muted-foreground",
    className
  ].join(" ");
</script>

<p class={descriptionClasses}>
  <slot />
</p>