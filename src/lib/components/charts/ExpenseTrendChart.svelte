<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import 'chartjs-adapter-date-fns'; // Import date adapter
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'; // Assuming shadcn-svelte
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs'; // Assuming shadcn-svelte
  import { format, subDays, eachDayOfInterval, parseISO, startOfDay } from 'date-fns';
  import type { Expense } from '../../../shared/schema'; // Use shared schema type

  export let expenses: Expense[] = [];
  export let isLoading: boolean = false;

  type TimeFrame = '7d' | '30d' | '90d';

  let canvasElement: HTMLCanvasElement;
  let chartInstance: Chart | null = null;
  let activeTimeFrame: TimeFrame = '30d'; // Default timeframe

  // --- Reactive Data Processing ---
  $: chartDataProcessed = processChartData(expenses);

  function processChartData(expenseData: Expense[]) {
    if (!expenseData || !expenseData.length) return null;

    const calculateMovingAverage = (data: { date: string; amount: number }[], days: number) => {
      return data.map((entry, index, arr) => {
        const start = Math.max(0, index - days + 1);
        const subset = arr.slice(start, index + 1);
        const sum = subset.reduce((acc, curr) => acc + curr.amount, 0);
        return sum / subset.length; // Return only the average value
      });
    };

    const generateTimeFrameData = (days: number) => {
      const endDate = startOfDay(new Date()); // Use start of today for consistency
      const startDate = startOfDay(subDays(endDate, days - 1));

      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

      const dailyTotalsMap = new Map<string, number>();
      dateRange.forEach(date => {
        dailyTotalsMap.set(format(date, 'yyyy-MM-dd'), 0);
      });

      expenseData.forEach(expense => {
        try {
          const expenseDate = startOfDay(parseISO(expense.date));
          const dateString = format(expenseDate, 'yyyy-MM-dd');
          const cost = parseFloat(expense.cost);

          if (dailyTotalsMap.has(dateString) && !isNaN(cost)) {
             dailyTotalsMap.set(dateString, (dailyTotalsMap.get(dateString) || 0) + cost);
          }
        } catch (e) {
            console.error(`Invalid date format for expense ${expense.id}: ${expense.date}`);
        }
      });

      // Convert map back to array sorted by date for chart.js and moving average calculation
      const dailyData = Array.from(dailyTotalsMap.entries())
                           .map(([date, amount]) => ({ date, amount }))
                           .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


      const movingAverages = calculateMovingAverage(dailyData, 7);

      return {
        labels: dailyData.map(d => d.date), // Use date strings as labels
        dailyAmounts: dailyData.map(d => d.amount),
        movingAverages: movingAverages
      };
    };

    return {
      '7d': generateTimeFrameData(7),
      '30d': generateTimeFrameData(30),
      '90d': generateTimeFrameData(90)
    };
  }

  // --- Chart Rendering ---
  function renderChart() {
    if (!canvasElement || !chartDataProcessed) return;

    const dataForTimeframe = chartDataProcessed[activeTimeFrame];
    if (!dataForTimeframe) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    // Destroy previous instance if exists
    chartInstance?.destroy();

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataForTimeframe.labels,
        datasets: [
          {
            label: 'Daily Total',
            data: dataForTimeframe.dailyAmounts,
            borderColor: '#2563eb', // Blue
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.1,
            fill: true,
          },
          {
            label: '7-Day Average',
            data: dataForTimeframe.movingAverages,
            borderColor: '#16a34a', // Green
            borderDash: [5, 5],
            tension: 0.1,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: activeTimeFrame === '7d' ? 'day' : 'week', // Adjust unit based on timeframe
              tooltipFormat: 'MMM d, yyyy',
              displayFormats: {
                 day: 'MMM d',
                 week: 'MMM d'
              }
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (USD)' // TODO: Make currency dynamic
            },
            ticks: {
               callback: function(value) {
                 // Format as currency
                 return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(Number(value));
               }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
      }
    });
  }

  // Update chart when timeframe or data changes
  $: if (canvasElement && chartDataProcessed) {
      renderChart();
  }

  onMount(() => {
    renderChart(); // Initial render
  });

  onDestroy(() => {
    chartInstance?.destroy();
  });

</script>

<Card>
  <CardHeader>
    <CardTitle>Expense Trends</CardTitle>
  </CardHeader>
  <CardContent>
    {#if isLoading}
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !chartDataProcessed}
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        No expense data available for trend analysis.
      </div>
    {:else}
      <Tabs bind:value={activeTimeFrame} class="space-y-4">
        <TabsList>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
        </TabsList>

        <!-- Chart Canvas (only one needed, data updates reactively) -->
        <div class="h-[400px] relative">
           <canvas bind:this={canvasElement}></canvas>
        </div>
      </Tabs>
    {/if}
  </CardContent>
</Card>