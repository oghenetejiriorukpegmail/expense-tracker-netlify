<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute footer classes
  $: footerClasses = [
    "flex items-center p-6 pt-0",
    className
  ].join(" ");
</script>

<div class={footerClasses}>
  <slot />
</div>