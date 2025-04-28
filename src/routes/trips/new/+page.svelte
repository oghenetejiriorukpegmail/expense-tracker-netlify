<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { format, parseISO } from 'date-fns';
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import { insertTripSchema } from '../../../shared/schema'; // Adjust path

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'; // For status, currency
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';

  // Assuming lucide-svelte
  import { Loader2 } from 'lucide-svelte';

  // --- Form Setup ---
  // Use the imported schema directly
  const tripSchema = insertTripSchema;
  type TripFormData = z.infer<typeof tripSchema>;

  const { form, handleSubmit, handleChange, isSubmitting, errors } = createForm({
    initialValues: {
      name: "",
      description: "",
      status: "Planned", // Default status
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      budget: undefined, // Optional number
      currency: "USD", // Default currency
      location: "",
      tags: [], // Optional array of strings
    },
    validationSchema: zod(tripSchema),
    onSubmit: async (values) => {
      await handleFormSubmit(values);
    }
  });

  // --- State ---
  let submitError: string | null = null;
  // TODO: Implement toast notifications

  // --- Submission Logic ---
  async function handleFormSubmit(values: TripFormData) {
    submitError = null;
    try {
      // Prepare data for API (ensure dates are ISO strings if API expects that)
      const apiPayload = {
          ...values,
          // Convert dates back to Date objects or ensure API handles YYYY-MM-DD strings
          startDate: parseISO(values.startDate as unknown as string), // Coerce back if needed by API
          endDate: parseISO(values.endDate as unknown as string),     // Coerce back if needed by API
          budget: values.budget ? Number(values.budget) : undefined, // Ensure budget is number or undefined
          tags: values.tags || [], // Ensure tags is an array
      };

      console.log("Submitting trip data:", apiPayload);

      const createdTrip = await api.post('/trips', apiPayload);

      console.log("Trip created:", createdTrip);
      // TODO: Show success toast

      await invalidateAll(); // Invalidate trip list data
      goto('/trips'); // Navigate back to the trips list

    } catch (error) {
      console.error("Error submitting trip:", error);
      submitError = error instanceof Error ? error.message : "An unknown error occurred";
      // TODO: Show error toast
    }
  }

  // Options for selects
  const statusOptions = ['Planned', 'InProgress', 'Completed', 'Cancelled'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']; // Example currencies

</script>

<div class="p-4 md:p-8 max-w-2xl mx-auto">
  <Card>
    <CardHeader>
      <CardTitle>Add New Trip</CardTitle>
      <CardDescription>Plan your next journey by filling in the details below.</CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- Name -->
          <div class="md:col-span-2">
            <Label for="name">Trip Name <span class="text-red-500">*</span></Label>
            <Input id="name" name="name" placeholder="e.g., Summer Vacation, Client Meeting NYC" use:form on:change={handleChange} bind:value={$form.name} class={$errors.name ? 'border-red-500' : ''} />
            {#if $errors.name}<p class="text-red-500 text-sm mt-1">{$errors.name}</p>{/if}
          </div>

          <!-- Description -->
          <div class="md:col-span-2">
            <Label for="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional details about the trip..." use:form on:change={handleChange} bind:value={$form.description} class={`min-h-[80px] ${$errors.description ? 'border-red-500' : ''}`} />
            {#if $errors.description}<p class="text-red-500 text-sm mt-1">{$errors.description}</p>{/if}
          </div>

          <!-- Start Date -->
          <div>
            <Label for="startDate">Start Date <span class="text-red-500">*</span></Label>
            <Input id="startDate" type="date" name="startDate" use:form on:change={handleChange} bind:value={$form.startDate} class={$errors.startDate ? 'border-red-500' : ''} />
            {#if $errors.startDate}<p class="text-red-500 text-sm mt-1">{$errors.startDate}</p>{/if}
          </div>

          <!-- End Date -->
          <div>
            <Label for="endDate">End Date <span class="text-red-500">*</span></Label>
            <Input id="endDate" type="date" name="endDate" use:form on:change={handleChange} bind:value={$form.endDate} class={$errors.endDate ? 'border-red-500' : ''} />
            {#if $errors.endDate}<p class="text-red-500 text-sm mt-1">{$errors.endDate}</p>{/if}
          </div>

           <!-- Status -->
          <div>
             <Label for="status">Status <span class="text-red-500">*</span></Label>
             <Select name="status" onValueChange={(val) => handleChange({ target: { name: 'status', value: val } })} value={$form.status}>
                <SelectTrigger id="status" class={$errors.status ? 'border-red-500' : ''}>
                   <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                   {#each statusOptions as statusOpt}
                      <SelectItem value={statusOpt}>{statusOpt}</SelectItem>
                   {/each}
                </SelectContent>
             </Select>
             {#if $errors.status}<p class="text-red-500 text-sm mt-1">{$errors.status}</p>{/if}
          </div>

           <!-- Location -->
          <div>
            <Label for="location">Location</Label>
            <Input id="location" name="location" placeholder="e.g., Paris, France" use:form on:change={handleChange} bind:value={$form.location} class={$errors.location ? 'border-red-500' : ''} />
            {#if $errors.location}<p class="text-red-500 text-sm mt-1">{$errors.location}</p>{/if}
          </div>

          <!-- Budget -->
          <div>
            <Label for="budget">Budget</Label>
             <div class="relative">
                <!-- TODO: Dynamically show currency symbol based on selection -->
                <span class="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">$</span>
                <Input id="budget" type="number" step="0.01" name="budget" placeholder="0.00" use:form on:change={handleChange} bind:value={$form.budget} class={`pl-7 ${$errors.budget ? 'border-red-500' : ''}`} />
             </div>
            {#if $errors.budget}<p class="text-red-500 text-sm mt-1">{$errors.budget}</p>{/if}
          </div>

           <!-- Currency -->
          <div>
             <Label for="currency">Currency <span class="text-red-500">*</span></Label>
             <Select name="currency" onValueChange={(val) => handleChange({ target: { name: 'currency', value: val } })} value={$form.currency}>
                <SelectTrigger id="currency" class={$errors.currency ? 'border-red-500' : ''}>
                   <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                   {#each currencyOptions as currencyOpt}
                      <SelectItem value={currencyOpt}>{currencyOpt}</SelectItem>
                   {/each}
                </SelectContent>
             </Select>
             {#if $errors.currency}<p class="text-red-500 text-sm mt-1">{$errors.currency}</p>{/if}
          </div>

           <!-- Tags -->
           <!-- TODO: Implement a better tag input component -->
           <div class="md:col-span-2">
             <Label for="tags">Tags</Label>
             <Input id="tags" name="tags" placeholder="e.g., business, vacation, conference (comma-separated)" use:form on:change={handleChange} bind:value={$form.tags} class={$errors.tags ? 'border-red-500' : ''} />
             <p class="text-xs text-gray-500 mt-1">Enter tags separated by commas.</p>
             {#if $errors.tags}<p class="text-red-500 text-sm mt-1">{$errors.tags}</p>{/if}
           </div>

        </div>

        {#if submitError}
          <p class="text-red-600 text-sm">{submitError}</p>
        {/if}

        <CardFooter class="pt-6 flex justify-end space-x-3">
           <Button type="button" variant="outline" on:click={() => goto('/trips')}>Cancel</Button>
           <Button type="submit" disabled={$isSubmitting}>
             {#if $isSubmitting}
               <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
             {:else}
               Save Trip
             {/if}
           </Button>
        </CardFooter>

      </form>
    </CardContent>
  </Card>
</div>