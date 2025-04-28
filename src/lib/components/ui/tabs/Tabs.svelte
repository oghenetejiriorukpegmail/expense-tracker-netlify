<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  
  // Props
  export let defaultValue: string | undefined = undefined;
  export let value: string | undefined = undefined;
  export let activationMode: 'automatic' | 'manual' = 'automatic';
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Create a store for the selected value
  const selectedValue = writable(value || defaultValue);
  
  // Update the store when the value prop changes
  $: if (value !== undefined) {
    selectedValue.set(value);
  }
  
  // Set the context for child components
  setContext('tabs', {
    selectedValue,
    activationMode,
    registerTab: (tabValue: string) => {
      // If no value is selected yet, select the first tab
      if ($selectedValue === undefined) {
        selectedValue.set(tabValue);
      }
    },
    selectTab: (tabValue: string) => {
      selectedValue.set(tabValue);
    }
  });
</script>

<div class={className}>
  <slot />
</div>