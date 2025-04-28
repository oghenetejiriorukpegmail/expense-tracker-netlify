<script lang="ts">
  import { format } from 'date-fns';
  import { Loader2, AlertCircle, Eye, Edit, Trash2, ArrowUpDown } from 'lucide-svelte';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';
  import { Button } from '$lib/components/ui/button';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { createEventDispatcher } from 'svelte';
  
  // Define the expense interface
  interface Expense {
    id: number;
    date: string;
    type: string;
    vendor: string;
    location: string;
    tripName: string;
    cost: string;
    receiptPath?: string | null;
    status?: string | null;
    ocrError?: string | null;
  }

  // Props
  export let expenses: Expense[] = [];
  export let onEdit: (id: number) => void = () => {};
  export let onDelete: (id: number) => void = () => {};

  // Event dispatcher
  const dispatch = createEventDispatcher();

  // Sorting state
  let sortField: keyof Expense = "date";
  let sortDirection: "asc" | "desc" = "desc";
  
  // Handle sorting
  function handleSort(field: keyof Expense) {
    if (field === sortField) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortField = field;
      sortDirection = "asc";
    }
  }
  
  // Reactive sorted expenses
  $: sortedExpenses = [...expenses].sort((a, b) => {
    // Handle potential null status for sorting robustness
    const statusA = a.status || 'complete';
    const statusB = b.status || 'complete';

    if (sortField === "cost") {
      // Convert cost string to number for comparison
      const costA = parseFloat(a.cost || '0');
      const costB = parseFloat(b.cost || '0');
      return sortDirection === "asc" ? costA - costB : costB - costA;
    } else if (sortField === "date") {
      // Date is string 'YYYY-MM-DD', compare directly
      return sortDirection === "asc"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    } else {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      return 0;
    }
  });

  // Function to view receipt
  function viewReceipt(receiptPath: string) {
    // Get environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME;
    
    if (supabaseUrl && bucketName && receiptPath) {
      // Constructing public URL
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${receiptPath}`;
      dispatch('viewReceipt', { imageUrl });
    } else {
      console.error("Supabase URL or Bucket Name not configured, or receipt path missing.");
    }
  }
</script>

<div class="border rounded-md">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead 
          class="cursor-pointer"
          on:click={() => handleSort("date")}
        >
          <div class="flex items-center">
            Date
            {#if sortField === "date"}
              <ArrowUpDown class={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
            {/if}
          </div>
        </TableHead>
        <TableHead 
          class="cursor-pointer"
          on:click={() => handleSort("type")}
        >
          <div class="flex items-center">
            Type
            {#if sortField === "type"}
              <ArrowUpDown class={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
            {/if}
          </div>
        </TableHead>
        <TableHead 
          class="cursor-pointer"
          on:click={() => handleSort("vendor")}
        >
          <div class="flex items-center">
            Vendor
            {#if sortField === "vendor"}
              <ArrowUpDown class={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
            {/if}
          </div>
        </TableHead>
        <TableHead>Location</TableHead>
        <TableHead>Trip</TableHead>
        <TableHead 
          class="text-right cursor-pointer"
          on:click={() => handleSort("cost")}
        >
          <div class="flex items-center justify-end">
            Amount
            {#if sortField === "cost"}
              <ArrowUpDown class={`ml-1 h-3 w-3 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
            {/if}
          </div>
        </TableHead>
        <TableHead class="text-center">Receipt</TableHead>
        <TableHead class="text-center">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if sortedExpenses.length > 0}
        {#each sortedExpenses as expense}
          <TableRow class={expense.status === 'processing_ocr' ? 'opacity-60' : ''}>
            <TableCell>{format(new Date(expense.date.replace(/-/g, '/')), "MMM d, yyyy")}</TableCell>
            <TableCell>
              <div class="flex items-center space-x-2">
                {#if expense.status === 'processing_ocr'}
                  <Loader2 class="h-4 w-4 animate-spin text-blue-500" />
                {/if}
                {#if expense.status === 'ocr_failed'}
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger>
                        <AlertCircle class="h-4 w-4 text-red-500" />
                      </TooltipTrigger>
                      <TooltipContent class="max-w-xs break-words">
                        <p>OCR Failed: {expense.ocrError || 'Unknown error'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                {/if}
                <span>{expense.type}</span>
              </div>
            </TableCell>
            <TableCell>{expense.vendor}</TableCell>
            <TableCell>{expense.location}</TableCell>
            <TableCell>
              <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-primary text-xs rounded-full">
                {expense.tripName}
              </span>
            </TableCell>
            <TableCell class="text-right font-medium">
              ${parseFloat(expense.cost).toFixed(2)}
            </TableCell>
            <TableCell class="text-center">
              {#if expense.receiptPath}
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={expense.status === 'processing_ocr'}
                  on:click={() => viewReceipt(expense.receiptPath)}
                >
                  <Eye class="h-4 w-4" />
                </Button>
              {:else}
                <span class="text-gray-400 text-sm">None</span>
              {/if}
            </TableCell>
            <TableCell class="text-center">
              <div class="flex justify-center space-x-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  class="text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={expense.status === 'processing_ocr'}
                  on:click={() => onEdit(expense.id)}
                >
                  <Edit class="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost"
                  size="sm"
                  class="text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={expense.status === 'processing_ocr'}
                  on:click={() => onDelete(expense.id)}
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        {/each}
      {:else}
        <TableRow>
          <TableCell colSpan={8} class="text-center py-6 text-gray-500 dark:text-gray-400">
            No expenses found
          </TableCell>
        </TableRow>
      {/if}
    </TableBody>
  </Table>
</div>