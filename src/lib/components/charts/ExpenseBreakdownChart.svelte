<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto'; // Import Chart.js
  import type { Expense } from '../../../shared/schema'; // Adjust path as needed

  export let expenses: Expense[] = [];

  let canvasElement: HTMLCanvasElement;
  let chartInstance: Chart | null = null;

  // Function to process expenses and prepare chart data
  function prepareChartData(expenseData: Expense[]) {
    const expensesByType: { [key: string]: number } = {};
    expenseData.forEach(expense => {
      const type = expense.type || 'Uncategorized';
      const cost = parseFloat(expense.cost); // Ensure cost is a number
      if (!isNaN(cost)) {
        expensesByType[type] = (expensesByType[type] || 0) + cost;
      }
    });

    const labels = Object.keys(expensesByType);
    const data = Object.values(expensesByType);

    // Generate colors dynamically (or use predefined ones)
    const backgroundColors = labels.map((_, i) => `hsl(${i * (360 / labels.length)}, 70%, 60%)`);

    return {
      labels,
      datasets: [{
        label: 'Expenses by Category',
        data,
        backgroundColor: backgroundColors,
        hoverOffset: 4
      }]
    };
  }

  // Reactive statement to update chart when expenses change
  $: if (chartInstance && expenses) {
    const chartData = prepareChartData(expenses);
    chartInstance.data.labels = chartData.labels;
    chartInstance.data.datasets[0].data = chartData.datasets[0].data;
    chartInstance.data.datasets[0].backgroundColor = chartData.datasets[0].backgroundColor;
    chartInstance.update();
  }

  onMount(() => {
    if (canvasElement && expenses) {
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        const chartData = prepareChartData(expenses);
        chartInstance = new Chart(ctx, {
          type: 'doughnut', // Use doughnut chart for breakdown
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to fill container
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.label || '';
                    if (label) {
                      label += ': ';
                    }
                    if (context.parsed !== null) {
                      // Format as currency (assuming USD for now, ideally use locale/settings)
                      label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                    }
                    return label;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Cleanup on component destroy
    return () => {
      chartInstance?.destroy();
      chartInstance = null;
    };
  });

  onDestroy(() => {
    chartInstance?.destroy();
  });

</script>

<div class="chart-container relative h-64 md:h-80">
  {#if expenses && expenses.length > 0}
    <canvas bind:this={canvasElement}></canvas>
  {:else}
    <p class="text-center text-gray-500 pt-10">No expense data available to display chart.</p>
  {/if}
</div>

<style>
  .chart-container {
    /* Add any specific container styles if needed */
  }
</style>