<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute title classes
  $: titleClasses = [
    "mb-1 font-medium leading-none tracking-tight",
    className
  ].join(" ");
</script>

<h5 class={titleClasses}>
  <slot />
</h5>