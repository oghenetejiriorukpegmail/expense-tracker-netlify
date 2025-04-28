import { writable } from 'svelte/store';

export interface WidgetSettings {
  id: string;
  type: string;
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  settings: Record<string, any>;
}

interface DashboardState {
  widgets: WidgetSettings[];
  layout: string;
}

const DEFAULT_LAYOUT: WidgetSettings[] = [
  {
    id: 'expense-summary',
    type: 'ExpenseSummary',
    title: 'Expense Summary',
    position: { x: 0, y: 0, w: 2, h: 2 },
    settings: { timeframe: 'month' }
  },
  {
    id: 'spending-insights',
    type: 'SpendingInsights',
    title: 'Spending Insights',
    position: { x: 2, y: 0, w: 2, h: 2 },
    settings: {}
  },
  {
    id: 'report-builder',
    type: 'ReportBuilder',
    title: 'Report Generator',
    position: { x: 0, y: 2, w: 4, h: 2 },
    settings: {}
  }
];

function createDashboardStore() {
  const { subscribe, set, update } = writable<DashboardState>({
    widgets: DEFAULT_LAYOUT,
    layout: 'grid'
  });

  return {
    subscribe,
    updateWidgetPosition: (id: string, position: { x: number; y: number; w: number; h: number }) => {
      update(state => ({
        ...state,
        widgets: state.widgets.map(widget => 
          widget.id === id ? { ...widget, position } : widget
        )
      }));
    },
    updateWidgetSettings: (id: string, settings: Record<string, any>) => {
      update(state => ({
        ...state,
        widgets: state.widgets.map(widget =>
          widget.id === id ? { ...widget, settings: { ...widget.settings, ...settings } } : widget
        )
      }));
    },
    resetLayout: () => {
      set({ widgets: DEFAULT_LAYOUT, layout: 'grid' });
    },
    saveLayout: () => {
      update(state => {
        localStorage.setItem('dashboard-layout', JSON.stringify(state));
        return state;
      });
    },
    loadLayout: () => {
      const savedLayout = localStorage.getItem('dashboard-layout');
      if (savedLayout) {
        set(JSON.parse(savedLayout));
      }
    }
  };
}

export const dashboardStore = createDashboardStore();