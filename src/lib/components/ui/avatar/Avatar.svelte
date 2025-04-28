<script lang="ts">
  // Props
  export let size: "default" | "sm" | "lg" = "default";
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute avatar classes
  $: sizeClasses = {
    default: "h-10 w-10",
    sm: "h-8 w-8",
    lg: "h-12 w-12"
  };
  
  $: avatarClasses = [
    "relative flex shrink-0 overflow-hidden rounded-full",
    sizeClasses[size],
    className
  ].join(" ");
</script>

<div class={avatarClasses}>
  <slot />
</div>