<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';
  import { Card } from '$lib/components/ui/card';

  export let expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }>;
  export let isLoading: boolean;

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  $: if (expenses && !isLoading) {
    updateChart();
  }

  // Colors for the chart
  const colors = [
    '#2563eb', // blue-600
    '#dc2626', // red-600
    '#16a34a', // green-600
    '#ca8a04', // yellow-600
    '#9333ea', // purple-600
    '#db2777', // pink-600
    '#2dd4bf', // teal-400
    '#f97316', // orange-500
    '#6366f1', // indigo-500
    '#ec4899', // pink-500
  ];

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function calculateChartData() {
    if (!expenses.length) return null;

    // Group expenses by category
    const categoryTotals = expenses.reduce((acc, exp) => {
      if (!acc[exp.category]) {
        acc[exp.category] = 0;
      }
      acc[exp.category] += exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    // Sort categories by amount and calculate percentages
    const sortedCategories = Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category,
        total,
        percentage: (total / total) * 100
      }))
      .sort((a, b) => b.total - a.total);

    // Ensure we have enough colors
    while (colors.length < sortedCategories.length) {
      colors.push(...colors);
    }

    return {
      labels: sortedCategories.map(cat => cat.category),
      datasets: [{
        data: sortedCategories.map(cat => cat.total),
        backgroundColor: colors.slice(0, sortedCategories.length),
        borderColor: colors.slice(0, sortedCategories.length).map(color => color + '33'),
        borderWidth: 2,
        hoverOffset: 4
      }],
      categories: sortedCategories
    };
  }

  function updateChart() {
    const chartData = calculateChartData();
    if (!chartData) return;

    if (chart) {
      chart.destroy();
    }

    chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = (context.chart.data.datasets[0].data as number[])
                  .reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%',
        radius: '90%'
      }
    });
  }

  onMount(() => {
    if (!isLoading && expenses.length) {
      updateChart();
    }

    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });
</script>

{#if isLoading}
  <Card>
    <header class="px-6 py-4 border-b border-border">
      <h3 class="text-lg font-semibold">Expense Distribution</h3>
    </header>
    <div class="p-6">
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  </Card>
{:else if !expenses.length}
  <Card>
    <header class="px-6 py-4 border-b border-border">
      <h3 class="text-lg font-semibold">Expense Distribution</h3>
    </header>
    <div class="p-6">
      <div class="h-[400px] flex items-center justify-center text-muted">
        No expense data available
      </div>
    </div>
  </Card>
{:else}
  <Card>
    <header class="px-6 py-4 border-b border-border">
      <h3 class="text-lg font-semibold">Expense Distribution</h3>
    </header>
    <div class="p-6">
      <div class="h-[400px] relative">
        <canvas bind:this={canvas}></canvas>
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="text-center">
            <div class="text-sm text-muted">Total Expenses</div>
            <div class="text-2xl font-bold">
              {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
            </div>
          </div>
        </div>
      </div>

      <!-- Category Totals -->
      {#if calculateChartData()}
        <div class="mt-6 space-y-2">
          {#each calculateChartData().categories as category, i}
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  style="background-color: {colors[i]}"
                />
                <span>{category.category}</span>
              </div>
              <div class="font-medium">{formatCurrency(category.total)}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </Card>
{/if}