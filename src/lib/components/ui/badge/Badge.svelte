<script lang="ts">
  // Props
  export let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute badge classes
  $: badgeClasses = [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    variant === 'default' ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" : "",
    variant === 'secondary' ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" : "",
    variant === 'destructive' ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80" : "",
    variant === 'outline' ? "text-foreground" : "",
    className
  ].join(" ");
</script>

<div class={badgeClasses}>
  <slot />
</div>