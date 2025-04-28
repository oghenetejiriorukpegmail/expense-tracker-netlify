<script lang="ts">
  import { createPopover } from "@melt-ui/svelte";
  import { setContext } from "svelte";
  import { cn } from "$lib/utils";

  export let open = false;
  export let closeOnOutsideClick = true;
  export let closeOnEscape = true;
  export let portal = false;
  export let forceVisible = false;
  export let openFocus = undefined;
  export let closeFocus = undefined;
  export let preventScroll = false;
  export let onOpenChange = (open: boolean) => {};

  const {
    elements: { trigger, content, arrow },
    states: { open: isOpen },
    helpers: { toggle, close }
  } = createPopover({
    open,
    closeOnOutsideClick,
    closeOnEscape,
    portal,
    forceVisible,
    openFocus,
    closeFocus,
    preventScroll,
    onOpenChange
  });

  setContext("popover", {
    trigger,
    content,
    arrow,
    isOpen,
    toggle,
    close
  });
</script>

<slot />