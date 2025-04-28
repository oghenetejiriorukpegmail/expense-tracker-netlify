<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "$lib/utils";

  export let asChild = false;
  export let class = "";

  const { trigger, toggle } = getContext("popover");
</script>

{#if asChild}
  <slot {trigger} {toggle} />
{:else}
  <button
    use:trigger
    on:click={toggle}
    class={cn(class)}
    {...$$restProps}
  >
    <slot />
  </button>
{/if}