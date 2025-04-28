<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute header classes
  $: headerClasses = [
    "flex flex-col space-y-1.5 p-6",
    className
  ].join(" ");
</script>

<div class={headerClasses}>
  <slot />
</div>