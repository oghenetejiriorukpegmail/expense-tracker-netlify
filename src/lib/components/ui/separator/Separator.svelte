<script lang="ts">
  import { cn } from "$lib/utils";
  import { getContext } from "svelte";

  type Orientation = "horizontal" | "vertical";
  type Decorative = boolean;

  let className = "";
  export { className as class };
  export let orientation: Orientation = "horizontal";
  export let decorative: Decorative = true;
</script>

<div
  class={cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
    className
  )}
  {...$$restProps}
  role={decorative ? "none" : "separator"}
  aria-orientation={decorative ? undefined : orientation}
  data-orientation={orientation}
/>