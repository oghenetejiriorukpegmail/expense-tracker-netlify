<script lang="ts">
  import { createCalendar } from "@melt-ui/svelte";
  import { cn } from "$lib/utils";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";

  export let selected = undefined;
  export let mode: "single" | "multiple" | "range" = "single";
  export let numberOfMonths = 1;
  export let fromDate = undefined;
  export let toDate = undefined;
  export let disabled = undefined;
  export let weekStartsOn = 0;
  export let locale = undefined;
  export let showOutsideDays = true;
  export let fixedWeeks = false;
  export let initialFocus = false;
  export let onSelect = (date) => {};
  export let class = "";

  const {
    months,
    nextMonth,
    previousMonth,
    prevButtonDisabled,
    nextButtonDisabled,
    headings,
    weekdays,
    getCellProps,
    getDateProps
  } = createCalendar({
    mode,
    selected,
    numberOfMonths,
    weekStartsOn,
    fromDate,
    toDate,
    locale,
    disabled,
    showOutsideDays,
    fixedWeeks,
    onSelect
  });
</script>

<div class={cn("p-3", class)}>
  <div class="flex justify-between mb-2">
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0"
      disabled={$prevButtonDisabled}
      on:click={previousMonth}
    >
      <ChevronLeft class="h-4 w-4" />
      <span class="sr-only">Previous month</span>
    </button>
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0"
      disabled={$nextButtonDisabled}
      on:click={nextMonth}
    >
      <ChevronRight class="h-4 w-4" />
      <span class="sr-only">Next month</span>
    </button>
  </div>
  {#each $months as month}
    <div class="space-y-4">
      <div class="grid grid-cols-7 text-center text-xs leading-6 text-muted-foreground">
        {#each $weekdays as day}
          <div>{day}</div>
        {/each}
      </div>
      <div class="grid grid-cols-7 text-sm">
        {#each month.days as day}
          {@const cellProps = getCellProps(day)}
          {@const dateProps = getDateProps(day)}
          <div {...cellProps}>
            <button
              {...dateProps}
              class={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                day.now && "bg-accent text-accent-foreground",
                day.selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day.outside && "text-muted-foreground opacity-50",
                !day.selectable && "text-muted-foreground opacity-50 cursor-not-allowed"
              )}
              disabled={!day.selectable}
            >
              {day.day}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>