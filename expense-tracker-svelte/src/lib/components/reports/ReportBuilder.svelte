<script lang="ts">
  import { onMount } from 'svelte';
  import type { ExpenseData } from '$lib/types';

  export let expenses: ExpenseData[] = [];
  
  let selectedTemplate = 'summary';
  let startDate = '';
  let endDate = '';
  let exportFormat = 'pdf';
  let isGenerating = false;
  let error = '';
  let loadingMessage = '';

  const templates = [
    { id: 'summary', name: 'Summary Report', description: 'Overview of expenses with totals and categories' },
    { id: 'detailed', name: 'Detailed Report', description: 'Itemized list of all expenses with full details' },
    { id: 'category', name: 'Category Analysis', description: 'Breakdown and analysis by expense categories' }
  ];

  const exportFormats = [
    { id: 'pdf', name: 'PDF Document', icon: '📄' },
    { id: 'xlsx', name: 'Excel Spreadsheet', icon: '📊' },
    { id: 'csv', name: 'CSV File', icon: '📑' }
  ];

  async function generateReport() {
    if (!startDate || !endDate) {
      error = 'Please select both start and end dates';
      return;
    }

    isGenerating = true;
    error = '';

    try {
      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
      });

      switch (exportFormat) {
        case 'pdf':
          loadingMessage = 'Loading PDF libraries...';
          await generatePDF(filteredExpenses);
          break;
        case 'xlsx':
          loadingMessage = 'Loading Excel libraries...';
          await generateExcel(filteredExpenses);
          break;
        case 'csv':
          generateCSV(filteredExpenses);
          break;
      }
    } catch (err) {
      error = 'Error generating report: ' + (err instanceof Error ? err.message : String(err));
    } finally {
      isGenerating = false;
      loadingMessage = '';
    }
  }

  async function generatePDF(filteredExpenses: ExpenseData[]) {
    try {
      // Dynamically import jsPDF and jspdf-autotable
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(20);
      doc.text('Expense Report', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 20, 30);
  
      if (selectedTemplate === 'summary') {
        // Calculate totals
        const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const categoryTotals = filteredExpenses.reduce((acc, exp) => {
          const category = exp.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + exp.amount;
          return acc;
        }, {} as Record<string, number>);
  
        // Add summary table
        doc.autoTable({
          startY: 40,
          head: [['Category', 'Amount']],
          body: Object.entries(categoryTotals).map(([category, amount]) => [
            category,
            `$${amount.toFixed(2)}`
          ]),
          foot: [['Total', `$${total.toFixed(2)}`]]
        });
      } else {
        // Detailed expense list
        doc.autoTable({
          startY: 40,
          head: [['Date', 'Category', 'Description', 'Amount']],
          body: filteredExpenses.map(exp => [
            new Date(exp.date).toLocaleDateString(),
            exp.category || 'Uncategorized',
            exp.description || '',
            `$${exp.amount.toFixed(2)}`
          ])
        });
      }
  
      doc.save(`expense-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      throw new Error(`Failed to generate PDF: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function generateExcel(filteredExpenses: ExpenseData[]) {
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      
      const ws = XLSX.utils.json_to_sheet(
        filteredExpenses.map(exp => ({
          Date: new Date(exp.date).toLocaleDateString(),
          Category: exp.category || 'Uncategorized',
          Description: exp.description || '',
          Amount: exp.amount.toFixed(2)
        }))
      );
  
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      XLSX.writeFile(wb, `expense-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      throw new Error(`Failed to generate Excel file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function generateCSV(filteredExpenses: ExpenseData[]) {
    const csvContent = filteredExpenses
      .map(exp => [
        new Date(exp.date).toLocaleDateString(),
        exp.category || 'Uncategorized',
        exp.description || '',
        exp.amount.toFixed(2)
      ].join(','))
      .join('\n');

    const blob = new Blob([`Date,Category,Description,Amount\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
</script>

<div class="bg-white rounded-lg shadow p-6 space-y-6">
  <h2 class="text-2xl font-semibold">Generate Report</h2>

  <!-- Template Selection -->
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Report Template</label>
    <div class="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {#each templates as template}
        <button
          class="p-4 border rounded-lg text-left transition-colors"
          class:border-blue-500={selectedTemplate === template.id}
          class:bg-blue-50={selectedTemplate === template.id}
          on:click={() => selectedTemplate = template.id}
        >
          <h3 class="font-medium">{template.name}</h3>
          <p class="text-sm text-gray-500">{template.description}</p>
        </button>
      {/each}
    </div>
  </div>

  <!-- Date Range -->
  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label for="start-date" class="block text-sm font-medium text-gray-700">Start Date</label>
      <input
        type="date"
        id="start-date"
        bind:value={startDate}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
    <div>
      <label for="end-date" class="block text-sm font-medium text-gray-700">End Date</label>
      <input
        type="date"
        id="end-date"
        bind:value={endDate}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  </div>

  <!-- Export Format -->
  <div class="space-y-2">
    <label class="block text-sm font-medium text-gray-700">Export Format</label>
    <div class="flex gap-3">
      {#each exportFormats as format}
        <button
          class="flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors"
          class:border-blue-500={exportFormat === format.id}
          class:bg-blue-50={exportFormat === format.id}
          on:click={() => exportFormat = format.id}
        >
          <span>{format.icon}</span>
          <span>{format.name}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if error}
    <div class="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
      {error}
    </div>
  {/if}

  <!-- Generate Button -->
  <button
    on:click={generateReport}
    disabled={isGenerating}
    class="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {#if isGenerating}
      {#if loadingMessage}
        {loadingMessage}
      {:else}
        Generating Report...
      {/if}
    {:else}
      Generate Report
    {/if}
  </button>
</div>