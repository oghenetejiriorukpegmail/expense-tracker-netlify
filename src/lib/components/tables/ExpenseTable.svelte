<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { format, parseISO } from 'date-fns';
  import type { Expense } from '../../../shared/schema'; // Use shared schema type

  // Assuming shadcn-svelte components are installed and configured
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';

  // Assuming lucide-svelte icons are installed
  import { Eye, Edit, Trash2, ArrowUpDown, Loader2, AlertCircle } from 'lucide-svelte';

  // SvelteKit environment variables (ensure they are prefixed with PUBLIC_ in .env)
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_BUCKET_NAME } from '$env/static/public';

  // Props
  export let expenses: Expense[] = [];

  // Event dispatcher for edit/delete/view actions
  const dispatch = createEventDispatcher<{
    edit: number;
    delete: number;
    viewReceipt: string; // Dispatch URL
  }>();

  // Sorting state
  let sortField: keyof Expense | null = 'date';
  let sortDirection: 'asc' | 'desc' = 'desc';

  // Sorting function
  function handleSort(field: keyof Expense) {
    if (field === sortField) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'asc';
    }
  }

  // Reactive sorted expenses
  $: sortedExpenses = [...expenses].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    // Type-specific comparisons
    if (sortField === 'cost') {
      const costA = parseFloat(a.cost || '0');
      const costB = parseFloat(b.cost || '0');
      return sortDirection === 'asc' ? costA - costB : costB - costA;
    } else if (sortField === 'date') {
       try {
         // Compare dates properly
         const dateA = parseISO(a.date).getTime();
         const dateB = parseISO(b.date).getTime();
         return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
       } catch (e) {
         // Fallback for invalid dates
         return 0;
       }
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
       return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    // Add other type comparisons if needed

    return 0; // Default no sort
  });

  function formatCost(cost: string | number): string {
      const numCost = typeof cost === 'string' ? parseFloat(cost) : cost;
      if (isNaN(numCost)) return 'N/A';
      // TODO: Use dynamic currency from settings
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numCost);
  }

   function formatDate(dateString: string): string {
       try {
           // Assuming dateString is 'YYYY-MM-DD' or ISO format
           return format(parseISO(dateString), "MMM d, yyyy");
       } catch (e) {
           return "Invalid Date";
       }
   }

   function handleViewReceipt(receiptPath: string | null | undefined) {
       if (!receiptPath) return;
       // Construct public URL - consider switching to signed URLs via an API endpoint for better security
       if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_BUCKET_NAME) {
           const imageUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUBLIC_SUPABASE_BUCKET_NAME}/${receiptPath}`;
           dispatch('viewReceipt', imageUrl);
       } else {
           console.error("Supabase URL or Bucket Name not configured in public env vars.");
           // Optionally dispatch an error event or show a message
       }
   }

</script>

<div class="border rounded-md overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        {#each ['date', 'type', 'vendor', 'location', 'tripName', 'cost'] as field}
          {@const key = field as keyof Expense}
          <TableHead class="cursor-pointer whitespace-nowrap" on:click={() => handleSort(key)}>
            <div class="flex items-center">
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} <!-- Simple title case -->
              {#if sortField === key}
                <ArrowUpDown class="ml-1 h-3 w-3 transition-transform {sortDirection === 'desc' ? '' : 'rotate-180'}" />
              {/if}
            </div>
          </TableHead>
        {/each}
        <TableHead class="text-center whitespace-nowrap">Receipt</TableHead>
        <TableHead class="text-center whitespace-nowrap">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if sortedExpenses.length > 0}
        {#each sortedExpenses as expense (expense.id)}
          <TableRow class={expense.status === 'processing_ocr' ? 'opacity-60' : ''}>
            <TableCell class="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
            <TableCell>
              <div class="flex items-center space-x-2 whitespace-nowrap">
                {#if expense.status === 'processing_ocr'}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Loader2 class="h-4 w-4 animate-spin text-blue-500" /></TooltipTrigger>
                      <TooltipContent><p>Processing Receipt...</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                {:else if expense.status === 'ocr_failed'}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><AlertCircle class="h-4 w-4 text-red-500" /></TooltipTrigger>
                      <TooltipContent><p>OCR Failed: {expense.ocrError || 'Unknown error'}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                {/if}
                <span>{expense.type}</span>
              </div>
            </TableCell>
            <TableCell class="whitespace-nowrap">{expense.vendor}</TableCell>
            <TableCell class="whitespace-nowrap">{expense.location}</TableCell>
            <TableCell class="whitespace-nowrap">
              {#if expense.tripName}
                 <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-primary text-xs rounded-full">
                    {expense.tripName}
                 </span>
              {:else}
                 <span class="text-gray-400 text-xs italic">None</span>
              {/if}
            </TableCell>
            <TableCell class="text-right font-medium whitespace-nowrap">{formatCost(expense.cost)}</TableCell>
            <TableCell class="text-center">
              {#if expense.receiptPath}
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={expense.status === 'processing_ocr'}
                  on:click={() => handleViewReceipt(expense.receiptPath)}
                  aria-label="View Receipt"
                >
                  <Eye class="h-4 w-4" />
                </Button>
              {:else}
                <span class="text-gray-400 text-sm">None</span>
              {/if}
            </TableCell>
            <TableCell class="text-center">
              <div class="flex justify-center space-x-1 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={expense.status === 'processing_ocr'}
                  on:click={() => dispatch('edit', expense.id)}
                  aria-label="Edit Expense"
                >
                  <Edit class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={expense.status === 'processing_ocr'}
                  on:click={() => dispatch('delete', expense.id)}
                  aria-label="Delete Expense"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        {/each}
      {:else}
        <TableRow>
          <TableCell colspan={8} class="text-center py-6 text-gray-500 dark:text-gray-400">
            No expenses found
          </TableCell>
        </TableRow>
      {/if}
    </TableBody>
  </Table>
</div>