<script lang="ts">
  import { getContext } from 'svelte';
  
  // Props
  export let value: string;
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Get the tabs context
  const { selectedValue } = getContext('tabs');
  
  // Determine if this content is selected
  $: selected = $selectedValue === value;
  
  // Compute content classes
  $: contentClasses = [
    "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    selected ? "block" : "hidden",
    className
  ].join(" ");
</script>

<div
  role="tabpanel"
  id={`${value}-tab`}
  aria-labelledby={value}
  class={contentClasses}
  hidden={!selected}
>
  <slot />
</div>