<script lang="ts">
  import { getContext } from 'svelte';
  
  // Props
  export let value: string;
  export let disabled: boolean = false;
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Get the tabs context
  const { selectedValue, activationMode, selectTab, registerTab } = getContext('tabs');
  
  // Register this tab
  registerTab(value);
  
  // Determine if this tab is selected
  $: selected = $selectedValue === value;
  
  // Compute trigger classes
  $: triggerClasses = [
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-current",
    className
  ].join(" ");
  
  // Handle click
  function handleClick() {
    if (!disabled) {
      selectTab(value);
    }
  }
</script>

<button
  type="button"
  role="tab"
  aria-selected={selected}
  aria-controls={`${value}-tab`}
  {disabled}
  class={triggerClasses}
  on:click={handleClick}
>
  <slot />
</button>