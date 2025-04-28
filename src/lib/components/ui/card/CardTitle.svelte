<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute title classes
  $: titleClasses = [
    "text-2xl font-semibold leading-none tracking-tight",
    className
  ].join(" ");
</script>

<h3 class={titleClasses}>
  <slot />
</h3>