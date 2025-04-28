<script lang="ts">
  import { getContext } from "svelte";
  import { cn } from "$lib/utils";
  import { fly } from "svelte/transition";

  export let class = "";
  export let align = "center";
  export let sideOffset = 4;
  export let alignOffset = 0;
  export let avoidCollisions = true;
  export let sticky = "partial";
  export let hideWhenDetached = false;

  const { content, isOpen, arrow } = getContext("popover");
</script>

{#if $isOpen}
  <div
    use:content={{
      align,
      sideOffset,
      alignOffset,
      avoidCollisions,
      sticky,
      hideWhenDetached
    }}
    class={cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      class
    )}
    transition:fly={{ y: 5, duration: 150 }}
    {...$$restProps}
  >
    <div use:arrow />
    <slot />
  </div>
{/if}