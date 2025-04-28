<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute content classes
  $: contentClasses = [
    "p-6 pt-0",
    className
  ].join(" ");
</script>

<div class={contentClasses}>
  <slot />
</div>