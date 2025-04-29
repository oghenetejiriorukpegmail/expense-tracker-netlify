<script lang="ts">
  import { onMount } from 'svelte';
  import { dashboardStore, type WidgetSettings } from '$lib/stores/dashboard';
  import ExpenseSummary from '$lib/components/analytics/ExpenseSummary.svelte';
  import SpendingInsights from '$lib/components/analytics/SpendingInsights.svelte';
  import ReportBuilder from '$lib/components/reports/ReportBuilder.svelte';

  let widgets: WidgetSettings[] = [];
  let draggedWidget: string | null = null;
  let isEditing = false;

  // Subscribe to the dashboard store
  dashboardStore.subscribe(state => {
    widgets = state.widgets;
  });

  onMount(() => {
    dashboardStore.loadLayout();
  });

  function handleDragStart(event: DragEvent, widgetId: string) {
    if (!event.dataTransfer) return;
    draggedWidget = widgetId;
    event.dataTransfer.setData('text/plain', widgetId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(event: DragEvent, targetId: string) {
    event.preventDefault();
    if (!draggedWidget || !event.dataTransfer) return;

    const sourceWidget = widgets.find(w => w.id === draggedWidget);
    const targetWidget = widgets.find(w => w.id === targetId);

    if (sourceWidget && targetWidget) {
      const sourcePos = { ...sourceWidget.position };
      dashboardStore.updateWidgetPosition(sourceWidget.id, targetWidget.position);
      dashboardStore.updateWidgetPosition(targetWidget.id, sourcePos);
      dashboardStore.saveLayout();
    }

    draggedWidget = null;
  }

  function getWidgetComponent(type: string) {
    switch (type) {
      case 'ExpenseSummary':
        return ExpenseSummary;
      case 'SpendingInsights':
        return SpendingInsights;
      case 'ReportBuilder':
        return ReportBuilder;
      default:
        return null;
    }
  }

  function updateWidgetSettings(widget: WidgetSettings, settings: Record<string, any>) {
    dashboardStore.updateWidgetSettings(widget.id, settings);
    dashboardStore.saveLayout();
  }

  function resetLayout() {
    dashboardStore.resetLayout();
    dashboardStore.saveLayout();
  }
</script>

<div class="p-4">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <div class="space-x-2">
      <button
        class="px-4 py-2 text-sm font-medium rounded-md"
        class:bg-blue-600={isEditing}
        class:text-white={isEditing}
        class:bg-gray-100={!isEditing}
        on:click={() => isEditing = !isEditing}
      >
        {isEditing ? 'Save Layout' : 'Edit Layout'}
      </button>
      <button
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md"
        on:click={resetLayout}
      >
        Reset Layout
      </button>
    </div>
  </div>

  <div
    class="grid gap-4"
    style="grid-template-columns: repeat(4, 1fr); grid-auto-rows: minmax(200px, auto);"
  >
    {#each widgets as widget (widget.id)}
      <div
        class="relative"
        style="
          grid-column: span {widget.position.w};
          grid-row: span {widget.position.h};
        "
        draggable={isEditing}
        on:dragstart={(e) => handleDragStart(e, widget.id)}
        on:dragover={handleDragOver}
        on:drop={(e) => handleDrop(e, widget.id)}
        role="region"
        aria-label="Draggable widget: {widget.title}"
      >
        <div class="h-full bg-white rounded-lg shadow-sm overflow-hidden">
          {#if isEditing}
            <div class="absolute top-0 right-0 p-2 z-10 bg-gray-800 bg-opacity-50 rounded-bl">
              <button
                class="text-white hover:text-gray-200"
                on:click={() => {
                  const dialog = document.createElement('dialog');
                  dialog.innerHTML = `
                    <div class="p-4">
                      <h3 class="text-lg font-medium mb-4">Widget Settings</h3>
                      <form method="dialog">
                        <label class="block mb-2">
                          Title
                          <input type="text" value="${widget.title}" class="w-full border rounded px-2 py-1">
                        </label>
                        <div class="flex justify-end gap-2 mt-4">
                          <button class="px-4 py-2 text-sm bg-gray-100 rounded">Cancel</button>
                          <button class="px-4 py-2 text-sm bg-blue-600 text-white rounded">Save</button>
                        </div>
                      </form>
                    </div>
                  `;
                  document.body.appendChild(dialog);
                  dialog.showModal();
                }}
              >
                ⚙️
              </button>
            </div>
          {/if}
          
          <div class="p-4">
            <h3 class="text-lg font-medium mb-4">{widget.title}</h3>
            <div class="h-full">
              {#if getWidgetComponent(widget.type)}
                <svelte:component
                  this={getWidgetComponent(widget.type)}
                  {...widget.settings}
                  on:settingsChange={(e) => updateWidgetSettings(widget, e.detail)}
                />
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  :global(.grid) {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: minmax(200px, auto);
    gap: 1rem;
  }

  :global(.widget-dragging) {
    opacity: 0.5;
  }

  :global(.widget-drag-over) {
    border: 2px dashed #4299e1;
  }
</style>