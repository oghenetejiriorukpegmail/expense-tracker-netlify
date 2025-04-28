<script lang="ts">
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute card classes
  $: cardClasses = [
    "rounded-lg border bg-card text-card-foreground shadow-sm",
    className
  ].join(" ");
</script>

<div class={cardClasses}>
  <slot />
</div>