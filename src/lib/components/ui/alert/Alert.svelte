<script lang="ts">
  // Props
  export let variant: 'default' | 'destructive' = 'default';
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute alert classes
  $: alertClasses = [
    "relative w-full rounded-lg border p-4",
    variant === 'default' ? "bg-background text-foreground" : "",
    variant === 'destructive' ? "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive" : "",
    className
  ].join(" ");
</script>

<div role="alert" class={alertClasses}>
  <slot />
</div>