<script lang="ts">
  // Props
  export let type: string = "text";
  export let value: string = "";
  export let placeholder: string = "";
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let id: string | undefined = undefined;
  export let name: string | undefined = undefined;
  
  // Class handling
  let className = "";
  export { className as class };
  
  // Compute input classes
  $: inputClasses = [
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className
  ].join(" ");
  
  // Handle input change
  function handleInput(event) {
    value = event.target.value;
  }
</script>

<input
  type={type}
  value={value}
  {placeholder}
  {disabled}
  {required}
  {id}
  {name}
  class={inputClasses}
  on:input={handleInput}
  on:blur
  on:focus
  on:change
  on:keydown
  on:keyup
/>