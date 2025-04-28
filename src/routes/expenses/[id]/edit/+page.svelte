<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { format, parseISO } from 'date-fns';
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox'; // For removing receipt

  // Assuming lucide-svelte
  import { Loader2, Eye, Trash2 } from 'lucide-svelte';

  // SvelteKit environment variables
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_BUCKET_NAME } from '$env/static/public';

  export let data: PageData;

  // Reactive state from load function
  $: ({ expense, error: loadError, loading } = data); // Destructure loaded expense

  // --- Schema Definition (same as add for now) ---
  const dateRegex = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const ocrTemplate = 'general'; // TODO: Determine template based on expense or settings?

  const editExpenseSchema = (template: string) => {
     const baseSchema = {
      date: z.string()
        .min(1, { message: "Date is required" })
        .regex(dateRegex, { message: "Date must be in YYYY-MM-DD format" }),
      cost: z.string().min(1, { message: "Amount is required" })
        .refine((val) => !isNaN(parseFloat(val)), { message: "Amount must be a number" })
        .refine((val) => parseFloat(val) > 0, { message: "Amount must be greater than 0" }),
      tripName: z.string().min(1, { message: "Trip is required" }),
      comments: z.string().optional(),
    };
     if (template === 'travel') {
      return z.object({
        ...baseSchema,
        type: z.string().min(1, { message: "Expense type is required" }),
        description: z.string().min(1, { message: "Description/Purpose is required" }),
        vendor: z.string().min(1, { message: "Vendor name is required" }),
        location: z.string().min(1, { message: "Location is required" }),
      });
    } else { // General template
      return z.object({
        ...baseSchema,
        type: z.string().min(1, { message: "Expense type is required" }),
        vendor: z.string().min(1, { message: "Vendor name is required" }),
        location: z.string().min(1, { message: "Location is required" }),
      });
    }
  };

  const expenseSchema = editExpenseSchema(ocrTemplate);
  type ExpenseFormData = z.infer<typeof expenseSchema>;

  // --- Form Setup ---
  // Initialize form only when expense data is loaded
  let formState: ReturnType<typeof createForm> | null = null;

  $: if (expense && !formState) {
      formState = createForm({
          initialValues: {
              date: expense.date ? format(parseISO(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
              cost: expense.cost ?? "",
              tripName: expense.tripName ?? "",
              comments: expense.comments ?? "",
              type: expense.type ?? "",
              vendor: expense.vendor ?? "",
              location: expense.location ?? "",
              ...(ocrTemplate === 'travel' && { description: (expense as any).description ?? "" }), // Cast if needed
          } as any, // Use 'any' or define specific type based on template
          validationSchema: zod(expenseSchema),
          onSubmit: async (values) => {
              await handleFormSubmit(values);
          }
      });
  }

  // --- State ---
  let receiptFile: File | null = null;
  let removeExistingReceipt = false;
  let submitError: string | null = null;
  // TODO: Implement toast notifications

  // --- File Handling ---
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      receiptFile = input.files[0];
      removeExistingReceipt = false; // If new file selected, don't remove old one yet (API handles replacement)
    } else {
      receiptFile = null;
    }
  }

  // --- Submission Logic ---
  async function handleFormSubmit(values: ExpenseFormData) {
    if (!expense) return; // Should not happen if form is initialized
    submitError = null;

    try {
      const submitFormData = new FormData();

      // Append all form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitFormData.append(key, String(value));
        }
      });
      submitFormData.set('cost', String(parseFloat(values.cost)));

      // Handle receipt update/removal
      if (receiptFile) {
        submitFormData.append('receipt', receiptFile); // API PUT endpoint handles replacement
        console.log("Submitting updated expense with new receipt...");
      } else if (removeExistingReceipt && expense.receiptPath) {
         // We need a way to signal removal. The API PUT doesn't explicitly handle this.
         // Option 1: Add a specific field like `removeReceipt=true` to FormData (requires API change)
         // Option 2: Make a separate API call to delete the receipt *before* updating (complex)
         // Option 3: Set receiptPath to null/empty in the PUT payload (if API supports it)
         // For now, let's assume setting receiptPath to empty string signals removal (NEEDS API CONFIRMATION)
         submitFormData.append('receiptPath', ''); // Signal removal? Needs API support.
         console.log("Submitting updated expense, requesting receipt removal...");
      } else {
         console.log("Submitting updated expense (no receipt changes)...");
      }


      // Call the API to update the expense
      // Note: API client needs to support PUT with FormData
      const updatedExpense = await api.put(`/expenses/${expense.id}`, submitFormData); // Assuming api.put handles FormData

      console.log("Expense updated:", updatedExpense);
      // TODO: Show success toast

      // Invalidate data and navigate back
      await invalidateAll();
      goto('/expenses');

    } catch (error) {
      console.error("Error updating expense:", error);
      submitError = error instanceof Error ? error.message : "An unknown error occurred";
      // TODO: Show error toast
    }
  }

  function viewExistingReceipt() {
      if (!expense?.receiptPath) return;
      if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_BUCKET_NAME) {
           const imageUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUBLIC_SUPABASE_BUCKET_NAME}/${expense.receiptPath}`;
           // TODO: Open in modal or new tab
           window.open(imageUrl, '_blank');
       } else {
           console.error("Supabase URL or Bucket Name not configured.");
       }
  }

</script>

<div class="p-4 md:p-8 max-w-2xl mx-auto">
  <Card>
    <CardHeader>
      <CardTitle>Edit Expense</CardTitle>
      {#if expense}<CardDescription>Editing expense for {expense.vendor} on {formatDate(expense.date)}</CardDescription>{/if}
    </CardHeader>
    <CardContent>
      {#if loading}
        <p>Loading expense data...</p>
      {:else if loadError}
         <p class="text-red-500">Error loading expense: {loadError.message}</p>
      {:else if expense && formState}
        {@const { form, handleSubmit, handleChange, isSubmitting, errors } = formState}
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">

          <!-- Template indicator (read-only based on loaded expense?) -->
          <div class={`p-3 rounded-md border text-sm font-medium ${ocrTemplate === 'travel' ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'}`}>
            Template: {ocrTemplate === 'travel' ? 'Travel Expense' : 'General Receipt'}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Date -->
            <div>
              <Label for="date">Date <span class="text-red-500">*</span></Label>
              <Input id="date" type="date" name="date" use:form on:change={handleChange} bind:value={$form.date} class={$errors.date ? 'border-red-500' : ''} />
              {#if $errors.date}<p class="text-red-500 text-sm mt-1">{$errors.date}</p>{/if}
            </div>

            <!-- Cost -->
            <div>
              <Label for="cost">Amount <span class="text-red-500">*</span></Label>
               <div class="relative">
                  <span class="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">$</span>
                  <Input id="cost" type="number" step="0.01" name="cost" placeholder="0.00" use:form on:change={handleChange} bind:value={$form.cost} class={`pl-7 ${$errors.cost ? 'border-red-500' : ''}`} />
               </div>
              {#if $errors.cost}<p class="text-red-500 text-sm mt-1">{$errors.cost}</p>{/if}
            </div>

            <!-- Trip Name -->
            <div class="md:col-span-2">
              <Label for="tripName">Trip <span class="text-red-500">*</span></Label>
              <Input id="tripName" name="tripName" placeholder="Enter trip name" use:form on:change={handleChange} bind:value={$form.tripName} class={$errors.tripName ? 'border-red-500' : ''} />
              {#if $errors.tripName}<p class="text-red-500 text-sm mt-1">{$errors.tripName}</p>{/if}
            </div>

            <!-- Type -->
            <div>
              <Label for="type">Expense Type <span class="text-red-500">*</span></Label>
              <Input id="type" name="type" placeholder={ocrTemplate === 'travel' ? "e.g., Food, Transport" : "e.g., Office Supplies"} use:form on:change={handleChange} bind:value={$form.type} class={$errors.type ? 'border-red-500' : ''} />
              {#if $errors.type}<p class="text-red-500 text-sm mt-1">{$errors.type}</p>{/if}
            </div>

            <!-- Vendor -->
            <div>
              <Label for="vendor">Vendor <span class="text-red-500">*</span></Label>
              <Input id="vendor" name="vendor" placeholder="Vendor name" use:form on:change={handleChange} bind:value={$form.vendor} class={$errors.vendor ? 'border-red-500' : ''} />
              {#if $errors.vendor}<p class="text-red-500 text-sm mt-1">{$errors.vendor}</p>{/if}
            </div>

            <!-- Location -->
            <div>
              <Label for="location">Location <span class="text-red-500">*</span></Label>
              <Input id="location" name="location" placeholder={ocrTemplate === 'travel' ? "City, Country" : "Store Address"} use:form on:change={handleChange} bind:value={$form.location} class={$errors.location ? 'border-red-500' : ''} />
              {#if $errors.location}<p class="text-red-500 text-sm mt-1">{$errors.location}</p>{/if}
            </div>

            <!-- Description (Travel Only) -->
            {#if ocrTemplate === 'travel'}
              <div class="md:col-span-2">
                <Label for="description">Description/Purpose <span class="text-red-500">*</span></Label>
                <Textarea id="description" name="description" placeholder="Describe the purpose..." use:form on:change={handleChange} bind:value={$form.description} class={`min-h-[80px] ${$errors.description ? 'border-red-500' : ''}`} />
                {#if $errors.description}<p class="text-red-500 text-sm mt-1">{$errors.description}</p>{/if}
              </div>
            {/if}

            <!-- Comments -->
            <div class="md:col-span-2">
              <Label for="comments">Comments</Label>
              <Textarea id="comments" name="comments" placeholder="Additional details or items..." use:form on:change={handleChange} bind:value={$form.comments} class={`min-h-[80px] ${$errors.comments ? 'border-red-500' : ''}`} />
              {#if $errors.comments}<p class="text-red-500 text-sm mt-1">{$errors.comments}</p>{/if}
            </div>

             <!-- Receipt Upload / Management -->
             <div class="md:col-span-2 space-y-2">
               <Label>Receipt</Label>
               {#if expense.receiptPath && !removeExistingReceipt}
                 <div class="flex items-center space-x-2 text-sm">
                   <span>Current: {expense.receiptPath.split('/').pop()}</span>
                   <Button type="button" variant="outline" size="sm" on:click={viewExistingReceipt} class="h-7 px-2">
                     <Eye class="h-3 w-3 mr-1"/> View
                   </Button>
                   <label class="flex items-center space-x-1 cursor-pointer">
                     <Checkbox id="removeReceipt" bind:checked={removeExistingReceipt} on:change={() => { if(removeExistingReceipt) receiptFile = null; }}/>
                     <span class="text-xs">Remove</span>
                   </label>
                 </div>
               {/if}
               {#if !removeExistingReceipt}
                 <Input id="receipt" type="file" accept="image/*,.pdf" on:change={handleFileSelect} class="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                 {#if receiptFile}
                   <p class="text-sm text-gray-600 mt-1">New: {receiptFile.name}</p>
                 {/if}
               {:else}
                  <p class="text-sm text-red-600 mt-1">Existing receipt will be removed upon saving.</p>
               {/if}
             </div>

          </div>

          {#if submitError}
            <p class="text-red-600 text-sm">{submitError}</p>
          {/if}

          <CardFooter class="pt-6 flex justify-end space-x-3">
             <Button type="button" variant="outline" on:click={() => goto('/expenses')}>Cancel</Button>
             <Button type="submit" disabled={$isSubmitting}>
               {#if $isSubmitting}
                 <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Updating...
               {:else}
                 Update Expense
               {/if}
             </Button>
          </CardFooter>

        </form>
      {:else}
         <p>Expense data not available.</p>
      {/if}
    </CardContent>
  </Card>
</div>