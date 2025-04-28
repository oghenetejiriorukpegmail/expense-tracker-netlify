<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute description classes
  $: descriptionClasses = [
    "text-sm [&_p]:leading-relaxed",
    className
  ].join(" ");
</script>

<div class={descriptionClasses}>
  <slot />
</div>