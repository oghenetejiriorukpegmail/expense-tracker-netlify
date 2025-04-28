<script lang="ts">
  // Props
  export let for_id: string | undefined = undefined;
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute label classes
  $: labelClasses = [
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
    className
  ].join(" ");
</script>

<label 
  for={for_id} 
  class={labelClasses}
>
  <slot />
</label>