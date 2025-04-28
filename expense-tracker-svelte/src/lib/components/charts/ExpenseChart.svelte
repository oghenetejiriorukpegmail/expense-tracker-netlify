<script lang="ts">
  import { Card } from '$lib/components/ui/Card.svelte';
  import { onMount } from 'svelte';
  import { format } from 'date-fns';
  import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
  } from 'recharts';

  // Accept either expenses array or direct expenseData object
  export let expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: string;
  }> = [];
  
  export let expenseData: Record<string, number> | undefined = undefined;
  export let isLoading = false;

  // Chart colors
  const COLORS = [
    '#2563eb', // blue-600
    '#16a34a', // green-600
    '#ea580c', // orange-600
    '#dc2626', // red-600
    '#9333ea', // purple-600
    '#0891b2', // cyan-600
    '#ca8a04', // yellow-600
    '#db2777', // pink-600
    '#4f46e5', // indigo-600
    '#0d9488', // teal-600
  ];

  // Reactive data for the chart
  $: chartData = expenseData ? generateChartDataFromObject(expenseData) : generateChartData(expenses);

  // Function to generate chart data from expenses array
  function generateChartData(expenses) {
    if (!expenses || !expenses.length) return [];

    // Group expenses by category
    const categoryMap = new Map();
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      const amount = expense.amount || 0;
      
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + amount);
      } else {
        categoryMap.set(category, amount);
      }
    });

    // Convert map to array of objects
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value
    }));
  }

  // Function to generate chart data from expenseData object
  function generateChartDataFromObject(data: Record<string, number>) {
    if (!data || Object.keys(data).length === 0) return [];
    
    return Object.entries(data).map(([name, value]) => ({
      name,
      value
    }));
  }

  // Format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return `
        <div class="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p class="font-medium">${data.name}</p>
          <p class="text-primary">${formatCurrency(data.value)}</p>
        </div>
      `;
    }
    return '';
  };
</script>

<Card>
  <div class="p-4">
    <h3 class="text-lg font-semibold mb-4">Expense Breakdown</h3>
    
    {#if isLoading}
      <div class="h-[400px] flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {:else if !chartData.length}
      <div class="h-[400px] flex items-center justify-center text-muted-foreground">
        No expense data available
      </div>
    {:else}
      <div class="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {#each chartData as entry, index}
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              {/each}
            </Pie>
            <Tooltip content={CustomTooltip} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    {/if}
  </div>
</Card>