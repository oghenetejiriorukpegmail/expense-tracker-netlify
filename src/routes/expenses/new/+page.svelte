<script lang="ts">
  import { createForm } from 'svelte-forms-lib'; // Using svelte-forms-lib as an example
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { format, parse } from 'date-fns';
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';

  // Assuming shadcn-svelte components are set up
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';

  // Assuming lucide-svelte
  import { Loader2 } from 'lucide-svelte';

  // --- Schema Definition ---
  // Note: Using 'YYYY-MM-DD' for date consistency with backend/shared schema
  const dateRegex = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

  // Using 'general' template for now, fetch dynamically if needed
  const ocrTemplate = 'general';

  const createExpenseSchema = (template: string) => {
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
        description: z.string().min(1, { message: "Description/Purpose is required" }), // Specific to travel
        vendor: z.string().min(1, { message: "Vendor name is required" }),
        location: z.string().min(1, { message: "Location is required" }),
      });
    } else { // General template
      return z.object({
        ...baseSchema,
        type: z.string().min(1, { message: "Expense type is required" }),
        vendor: z.string().min(1, { message: "Vendor name is required" }),
        location: z.string().min(1, { message: "Location is required" }),
        // description is not part of the general schema
      });
    }
  };

  const expenseSchema = createExpenseSchema(ocrTemplate);
  type ExpenseFormData = z.infer<typeof expenseSchema>;

  // --- Form Setup ---
  const { form, handleSubmit, handleChange, isSubmitting, errors } = createForm({
    initialValues: {
      date: format(new Date(), 'yyyy-MM-dd'), // Use YYYY-MM-DD
      cost: "",
      tripName: "", // TODO: Fetch recent trips or allow selection?
      comments: "",
      type: "",
      vendor: "",
      location: "",
      ...(ocrTemplate === 'travel' && { description: "" }),
    } as any, // Use 'any' or define specific type based on template
    validationSchema: zod(expenseSchema),
    onSubmit: async (values) => {
      await handleFormSubmit(values);
    }
  });

  // --- State ---
  let receiptFile: File | null = null;
  let submitError: string | null = null;
  // TODO: Implement toast notifications

  // --- File Handling ---
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      receiptFile = input.files[0];
    } else {
      receiptFile = null;
    }
  }

  // --- Submission Logic ---
  async function handleFormSubmit(values: ExpenseFormData) {
    submitError = null; // Reset error
    try {
      const submitFormData = new FormData();

      // Append all form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          submitFormData.append(key, String(value));
        }
      });
       // Ensure cost is appended correctly
       submitFormData.set('cost', String(parseFloat(values.cost)));

      // Append file if selected
      if (receiptFile) {
        submitFormData.append('receipt', receiptFile);
        // The backend POST /api/expenses handles both manual data + optional receipt
        // It will create the expense and trigger background OCR if receipt exists
        console.log("Submitting expense with receipt...");
      } else {
        console.log("Submitting expense manually (no receipt)...");
      }

      // Call the API to create the expense
      const createdExpense = await api.post('/expenses', submitFormData); // api.post needs to handle FormData

      console.log("Expense created:", createdExpense);
      // TODO: Show success toast

      // Invalidate expense list data and navigate back
      await invalidateAll();
      goto('/expenses'); // Or maybe dashboard?

    } catch (error) {
      console.error("Error submitting expense:", error);
      submitError = error instanceof Error ? error.message : "An unknown error occurred";
      // TODO: Show error toast
    }
  }

  // --- Field Rendering Helpers (Simplified for Svelte) ---
  // We'll render fields directly in the template

</script>

<div class="p-4 md:p-8 max-w-2xl mx-auto">
  <Card>
    <CardHeader>
      <CardTitle>Add New Expense</CardTitle>
      <CardDescription>Fill in the details below or upload a receipt.</CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">

        <!-- Template indicator -->
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

           <!-- Receipt Upload -->
           <div class="md:col-span-2">
             <Label for="receipt">Receipt (Optional)</Label>
             <Input id="receipt" type="file" accept="image/*,.pdf" on:change={handleFileSelect} class="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
             {#if receiptFile}
               <p class="text-sm text-gray-600 mt-1">Selected: {receiptFile.name}</p>
             {/if}
             <p class="text-xs text-gray-500 mt-1">If you upload a receipt, it will be processed automatically.</p>
           </div>

        </div>

        {#if submitError}
          <p class="text-red-600 text-sm">{submitError}</p>
        {/if}

        <CardFooter class="pt-6 flex justify-end space-x-3">
           <Button type="button" variant="outline" on:click={() => goto('/expenses')}>Cancel</Button>
           <Button type="submit" disabled={$isSubmitting}>
             {#if $isSubmitting}
               <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
             {:else}
               Save Expense
             {/if}
           </Button>
        </CardFooter>

      </form>
    </CardContent>
  </Card>
</div>