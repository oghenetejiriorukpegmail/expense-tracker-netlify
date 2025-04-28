<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { format, parseISO } from 'date-fns';
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import { insertMileageLogSchema } from '../../../shared/schema'; // Adjust path
  import type { Trip } from '../../../shared/schema'; // Import Trip type for dropdown

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';

  // Assuming lucide-svelte
  import { Loader2 } from 'lucide-svelte';

  // --- Form Setup ---
  const mileageSchema = insertMileageLogSchema; // Use the final schema with refinement
  type MileageFormData = z.infer<typeof mileageSchema>;

  // TODO: Fetch trips to populate the optional tripId dropdown
  let availableTrips: Trip[] = [];
  // onMount(async () => {
  //   try {
  //     availableTrips = await api.get<Trip[]>('/trips');
  //   } catch (error) {
  //     console.error("Failed to fetch trips for dropdown:", error);
  //   }
  // });


  const { form, handleSubmit, handleChange, isSubmitting, errors } = createForm({
    initialValues: {
      tripDate: format(new Date(), 'yyyy-MM-dd'),
      startOdometer: '', // Keep as string for input binding
      endOdometer: '',   // Keep as string for input binding
      purpose: '',
      entryMethod: 'manual', // Default to manual
      tripId: undefined, // Optional trip association
    },
    validationSchema: zod(mileageSchema.extend({
        // Extend schema for form to handle string inputs for numbers before validation
        startOdometer: z.string().min(1, 'Required').refine(v => !isNaN(parseFloat(v)), 'Must be a number'),
        endOdometer: z.string().min(1, 'Required').refine(v => !isNaN(parseFloat(v)), 'Must be a number'),
    })),
    onSubmit: async (values) => {
      // Convert odometer strings to numbers before final submission validation/API call
      const numericValues = {
          ...values,
          startOdometer: parseFloat(values.startOdometer),
          endOdometer: parseFloat(values.endOdometer),
          tripId: values.tripId ? parseInt(String(values.tripId)) : undefined, // Ensure tripId is number or undefined
          tripDate: parseISO(values.tripDate as unknown as string), // Ensure date is Date object if API needs it
      };
       // Re-validate with the original schema expecting numbers
       const validationResult = mileageSchema.safeParse(numericValues);
       if (!validationResult.success) {
           // Manually set errors if needed, though svelte-forms-lib might handle this
           console.error("Final validation failed:", validationResult.error.flatten().fieldErrors);
           // Update form errors state if library doesn't automatically
           // This part depends heavily on the form library's specifics
           submitError = "Please check your odometer readings."; // Generic error
           return; // Stop submission
       }
      await handleFormSubmit(validationResult.data);
    }
  });

  // --- State ---
  let startImageFile: File | null = null;
  let endImageFile: File | null = null;
  let submitError: string | null = null;
  // TODO: Implement toast notifications

  // --- File Handling ---
  function handleFileSelect(event: Event, type: 'start' | 'end') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      if (type === 'start') startImageFile = input.files[0];
      else endImageFile = input.files[0];
    } else {
      if (type === 'start') startImageFile = null;
      else endImageFile = null;
    }
  }

  // --- Submission Logic ---
  async function handleFormSubmit(values: MileageFormData) {
    submitError = null;
    try {
      const submitFormData = new FormData();

      // Append form values (convert numbers back to string for FormData if needed by backend)
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
           if (key === 'tripDate' && value instanceof Date) {
               submitFormData.append(key, format(value, 'yyyy-MM-dd')); // Send date as string
           } else {
               submitFormData.append(key, String(value));
           }
        }
      });

      // Append files if selected
      if (startImageFile) submitFormData.append('startImage', startImageFile);
      if (endImageFile) submitFormData.append('endImage', endImageFile);

      console.log("Submitting mileage log...");
      // API client needs to handle FormData for POST
      const createdLog = await api.post('/mileage-logs', submitFormData);

      console.log("Mileage log created:", createdLog);
      // TODO: Show success toast

      await invalidateAll(); // Invalidate mileage log list data
      goto('/mileage'); // Navigate back to the list

    } catch (error) {
      console.error("Error submitting mileage log:", error);
      submitError = error instanceof Error ? error.message : "An unknown error occurred";
      // TODO: Show error toast
    }
  }

</script>

<div class="p-4 md:p-8 max-w-2xl mx-auto">
  <Card>
    <CardHeader>
      <CardTitle>Add New Mileage Log</CardTitle>
      <CardDescription>Record your travel distance and details.</CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- Trip Date -->
          <div>
            <Label for="tripDate">Date <span class="text-red-500">*</span></Label>
            <Input id="tripDate" type="date" name="tripDate" use:form on:change={handleChange} bind:value={$form.tripDate} class={$errors.tripDate ? 'border-red-500' : ''} />
            {#if $errors.tripDate}<p class="text-red-500 text-sm mt-1">{$errors.tripDate}</p>{/if}
          </div>

           <!-- Trip Association (Optional) -->
           <div>
             <Label for="tripId">Associate with Trip</Label>
             <Select name="tripId" onValueChange={(val) => handleChange({ target: { name: 'tripId', value: val } })} value={$form.tripId}>
                <SelectTrigger id="tripId" class={$errors.tripId ? 'border-red-500' : ''}>
                   <SelectValue placeholder="Select a trip (optional)" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value={null}>None</SelectItem>
                   {#each availableTrips as trip (trip.id)}
                      <SelectItem value={trip.id}>{trip.name}</SelectItem>
                   {:else}
                      <p class="p-2 text-sm text-gray-500">No trips available</p>
                   {/each}
                </SelectContent>
             </Select>
             {#if $errors.tripId}<p class="text-red-500 text-sm mt-1">{$errors.tripId}</p>{/if}
           </div>


          <!-- Start Odometer -->
          <div>
            <Label for="startOdometer">Start Odometer <span class="text-red-500">*</span></Label>
            <Input id="startOdometer" type="number" step="0.1" name="startOdometer" placeholder="e.g., 12345.6" use:form on:change={handleChange} bind:value={$form.startOdometer} class={$errors.startOdometer ? 'border-red-500' : ''} />
            {#if $errors.startOdometer}<p class="text-red-500 text-sm mt-1">{$errors.startOdometer}</p>{/if}
          </div>

          <!-- End Odometer -->
          <div>
            <Label for="endOdometer">End Odometer <span class="text-red-500">*</span></Label>
            <Input id="endOdometer" type="number" step="0.1" name="endOdometer" placeholder="e.g., 12456.7" use:form on:change={handleChange} bind:value={$form.endOdometer} class={$errors.endOdometer ? 'border-red-500' : ''} />
            {#if $errors.endOdometer}<p class="text-red-500 text-sm mt-1">{$errors.endOdometer}</p>{/if}
          </div>

           <!-- Purpose -->
          <div class="md:col-span-2">
            <Label for="purpose">Purpose</Label>
            <Textarea id="purpose" name="purpose" placeholder="Reason for the trip (e.g., Client Meeting)" use:form on:change={handleChange} bind:value={$form.purpose} class={`min-h-[60px] ${$errors.purpose ? 'border-red-500' : ''}`} />
            {#if $errors.purpose}<p class="text-red-500 text-sm mt-1">{$errors.purpose}</p>{/if}
          </div>

           <!-- Entry Method -->
           <div>
             <Label for="entryMethod">Entry Method <span class="text-red-500">*</span></Label>
             <Select name="entryMethod" onValueChange={(val) => handleChange({ target: { name: 'entryMethod', value: val } })} value={$form.entryMethod}>
                <SelectTrigger id="entryMethod" class={$errors.entryMethod ? 'border-red-500' : ''}>
                   <SelectValue placeholder="Select entry method" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="manual">Manual</SelectItem>
                   <SelectItem value="ocr">OCR (Requires Images)</SelectItem>
                </SelectContent>
             </Select>
             {#if $errors.entryMethod}<p class="text-red-500 text-sm mt-1">{$errors.entryMethod}</p>{/if}
           </div>

           <div></div> <!-- Spacer -->

           <!-- Start Odometer Image -->
           <div>
             <Label for="startImage">Start Odometer Image (Optional)</Label>
             <Input id="startImage" type="file" accept="image/*" on:change={(e) => handleFileSelect(e, 'start')} class="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
             {#if startImageFile}
               <p class="text-sm text-gray-600 mt-1">Selected: {startImageFile.name}</p>
             {/if}
           </div>

           <!-- End Odometer Image -->
           <div>
             <Label for="endImage">End Odometer Image (Optional)</Label>
             <Input id="endImage" type="file" accept="image/*" on:change={(e) => handleFileSelect(e, 'end')} class="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              {#if endImageFile}
               <p class="text-sm text-gray-600 mt-1">Selected: {endImageFile.name}</p>
             {/if}
           </div>

        </div>

        {#if submitError}
          <p class="text-red-600 text-sm">{submitError}</p>
        {/if}

        <CardFooter class="pt-6 flex justify-end space-x-3">
           <Button type="button" variant="outline" on:click={() => goto('/mileage')}>Cancel</Button>
           <Button type="submit" disabled={$isSubmitting}>
             {#if $isSubmitting}
               <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
             {:else}
               Save Mileage Log
             {/if}
           </Button>
        </CardFooter>

      </form>
    </CardContent>
  </Card>
</div>