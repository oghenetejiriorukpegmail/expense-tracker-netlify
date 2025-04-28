<script lang="ts">
  import { createDateRangePicker } from '@melt-ui/svelte';
  import { format } from 'date-fns';
  import { Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Button } from '../button/Button.svelte';
  import { cn } from '$lib/utils';
  import { createPopover } from '@melt-ui/svelte';
  import { fly } from 'svelte/transition';

  // Props
  export let startDate: Date | null = null;
  export let endDate: Date | null = null;
  export let placeholder = "Select date range";
  export let align: 'start' | 'center' | 'end' = 'start';
  export let disabled = false;
  export let className = "";

  // Create popover
  const {
    elements: { trigger, content, arrow },
    states: { open },
  } = createPopover({
    positioning: {
      placement: 'bottom',
      sameWidth: true,
    },
  });

  // Create date range picker
  const {
    dates,
    months,
    calendars,
    elements: { field, input, grid, cell, prevButton, nextButton },
    helpers: { isDateDisabled, isDateUnavailable },
    states: { focused, selected },
  } = createDateRangePicker({
    startOfWeek: 0, // Sunday
    defaultValue: {
      from: startDate,
      to: endDate,
    },
    onSelectedChange: ({ from, to }) => {
      startDate = from;
      endDate = to;
      if (from && to) {
        open.set(false);
      }
    },
  });

  // Format the date range for display
  $: displayValue = $selected.from && $selected.to
    ? `${format($selected.from, 'MMM d, yyyy')} - ${format($selected.to, 'MMM d, yyyy')}`
    : placeholder;

  // Handle clear button click
  function handleClear() {
    selected.set({ from: null, to: null });
    startDate = null;
    endDate = null;
  }
</script>

<div class={cn("relative", className)}>
  <Button
    use:trigger
    variant="outline"
    {disabled}
    class={cn(
      "w-full justify-start text-left font-normal",
      !$selected.from && "text-muted-foreground"
    )}
  >
    <Calendar class="mr-2 h-4 w-4" />
    {displayValue}
  </Button>
  
  {#if $open}
    <div
      use:content
      use:arrow={{ className: "fill-background" }}
      transition:fly={{ duration: 150, y: 5 }}
      class="z-50 w-auto rounded-md border bg-background p-4 shadow-md"
      style="--arrow-size: 0.5rem; --arrow-background: var(--background);"
    >
      <div class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        {#each $calendars as calendar (calendar.month)}
          <div class="space-y-4">
            <div class="flex items-center justify-between px-1">
              <div class="font-medium">
                {format(calendar.month, 'MMMM yyyy')}
              </div>
              <div class="flex space-x-1">
                <Button
                  use:prevButton
                  variant="outline"
                  size="icon"
                  class="h-7 w-7"
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>
                <Button
                  use:nextButton
                  variant="outline"
                  size="icon"
                  class="h-7 w-7"
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div use:grid={calendar} class="grid grid-cols-7 gap-1">
              {#each calendar.weekdays as weekday}
                <div class="text-center text-sm font-medium text-muted-foreground">
                  {weekday.charAt(0)}
                </div>
              {/each}
              {#each calendar.days as day (day.date)}
                <div
                  use:cell={day}
                  class={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md p-0 text-sm",
                    day.now && "bg-accent text-accent-foreground",
                    day.disabled && "text-muted-foreground opacity-50",
                    day.unavailable && "text-muted-foreground opacity-50",
                    day.selected && "bg-primary text-primary-foreground",
                    day.range && "bg-accent text-accent-foreground",
                    day.rangeStart && "rounded-l-md bg-primary text-primary-foreground",
                    day.rangeEnd && "rounded-r-md bg-primary text-primary-foreground",
                    !day.selected && !day.rangeStart && !day.rangeEnd && !day.range && !day.now && "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {day.date.getDate()}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-4 flex justify-end space-x-2">
        <Button variant="outline" size="sm" on:click={handleClear}>
          Clear
        </Button>
        <Button variant="outline" size="sm" on:click={() => open.set(false)}>
          Close
        </Button>
      </div>
    </div>
  {/if}
</div>