<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { format, parseISO } from 'date-fns';
  import { api } from '$lib/api/client';
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import { insertMileageLogSchema } from '../../../../shared/schema'; // Adjust path
  import type { PageData } from './$types';
  import type { Trip } from '../../../../shared/schema';

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';

  // Assuming lucide-svelte
  import { Loader2, Eye } from 'lucide-svelte';

  // SvelteKit environment variables
  import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_BUCKET_NAME } from '$env/static/public';

  export let data: PageData;

  // Reactive state from load function
  $: ({ log, availableTrips, error: loadError, loading } = data);

  // --- Form Setup ---
  const mileageSchema = insertMileageLogSchema; // Use the same schema for validation logic
  type MileageFormData = z.infer<typeof mileageSchema>;

  let formState: ReturnType<typeof createForm> | null = null;

  // Initialize form only when log data is loaded
  $: if (log && !formState) {
      formState = createForm({
          initialValues: {
              tripDate: log.tripDate ? format(parseISO(log.tripDate as unknown as string), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
              startOdometer: String(log.startOdometer ?? ''), // Keep as string for input
              endOdometer: String(log.endOdometer ?? ''),   // Keep as string for input
              purpose: log.purpose ?? '',
              entryMethod: log.entryMethod ?? 'manual',
              tripId: log.tripId ?? undefined,
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
                  tripId: values.tripId ? parseInt(String(values.tripId)) : undefined,
                  tripDate: parseISO(values.tripDate as unknown as string),
              };
              const validationResult = mileageSchema.safeParse(numericValues);
              if (!validationResult.success) {
                  console.error("Final validation failed:", validationResult.error.flatten().fieldErrors);
                  submitError = "Please check your odometer readings.";
                  return;
              }
              await handleFormSubmit(validationResult.data);
          }
      });
  }

  // --- State ---
  let startImageFile: File | null = null;
  let endImageFile: File | null = null;
  let removeExistingStartImage = false;
  let removeExistingEndImage = false;
  let submitError: string | null = null;
  // TODO: Implement toast notifications

  // --- File Handling ---
  function handleFileSelect(event: Event, type: 'start' | 'end') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      if (type === 'start') {
          startImageFile = input.files[0];
          removeExistingStartImage = false; // Don't remove if replacing
      } else {
          endImageFile = input.files[0];
          removeExistingEndImage = false; // Don't remove if replacing
      }
    } else {
      if (type === 'start') startImageFile = null;
      else endImageFile = null;
    }
  }

  // --- Submission Logic ---
  async function handleFormSubmit(values: MileageFormData) {
    if (!log) return;
    submitError = null;
    try {
      const submitFormData = new FormData();

      // Append form values
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
           if (key === 'tripDate' && value instanceof Date) {
               submitFormData.append(key, format(value, 'yyyy-MM-dd'));
           } else {
               submitFormData.append(key, String(value));
           }
        }
      });

      // Handle image updates/removals
      if (startImageFile) submitFormData.append('startImage', startImageFile);
      else if (removeExistingStartImage) submitFormData.append('removeStartImage', 'true'); // Signal removal

      if (endImageFile) submitFormData.append('endImage', endImageFile);
      else if (removeExistingEndImage) submitFormData.append('removeEndImage', 'true'); // Signal removal

      console.log("Updating mileage log...");
      // API client needs to handle PUT with FormData
      const updatedLog = await api.put(`/mileage-logs/${log.id}`, submitFormData);

      console.log("Mileage log updated:", updatedLog);
      // TODO: Show success toast

      await invalidateAll();
      goto('/mileage'); // Navigate back to the list

    } catch (error) {
      console.error("Error updating mileage log:", error);
      submitError = error instanceof Error ? error.message : "An unknown error occurred";
      // TODO: Show error toast
    }
  }

  function viewExistingImage(imageUrl: string | null | undefined) {
      if (!imageUrl) return;
      if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_BUCKET_NAME) {
           // Assuming images are public or we need signed URLs via API
           const fullUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUBLIC_SUPABASE_BUCKET_NAME}/${imageUrl}`; // Adjust bucket/path if needed
           window.open(fullUrl, '_blank');
       } else {
           console.error("Supabase URL or Bucket Name not configured.");
       }
  }

</script>

<div class="p-4 md:p-8 max-w-2xl mx-auto">
  <Card>
    <CardHeader>
      <CardTitle>Edit Mileage Log</CardTitle>
      {#if log}<CardDescription>Updating log from {format(parseISO(log.tripDate as unknown as string), 'MMM d, yyyy')}</CardDescription>{/if}
    </CardHeader>
    <CardContent>
       {#if loading}
         <p>Loading mileage log data...</p>
       {:else if loadError}
          <p class="text-red-500">Error loading log: {loadError.message}</p>
          <a href="/mileage" class="text-blue-600 hover:underline mt-2 block">Back to Mileage Logs</a>
       {:else if log && formState}
         {@const { form, handleSubmit, handleChange, isSubmitting, errors } = formState}
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
               <Input id="startOdometer" type="number" step="0.1" name="startOdometer" use:form on:change={handleChange} bind:value={$form.startOdometer} class={$errors.startOdometer ? 'border-red-500' : ''} />
               {#if $errors.startOdometer}<p class="text-red-500 text-sm mt-1">{$errors.startOdometer}</p>{/if}
             </div>

             <!-- End Odometer -->
             <div>
               <Label for="endOdometer">End Odometer <span class="text-red-500">*</span></Label>
               <Input id="endOdometer" type="number" step="0.1" name="endOdometer" use:form on:change={handleChange} bind:value={$form.endOdometer} class={$errors.endOdometer ? 'border-red-500' : ''} />
               {#if $errors.endOdometer}<p class="text-red-500 text-sm mt-1">{$errors.endOdometer}</p>{/if}
             </div>

              <!-- Purpose -->
             <div class="md:col-span-2">
               <Label for="purpose">Purpose</Label>
               <Textarea id="purpose" name="purpose" use:form on:change={handleChange} bind:value={$form.purpose} class={`min-h-[60px] ${$errors.purpose ? 'border-red-500' : ''}`} />
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
                      <SelectItem value="ocr">OCR</SelectItem>
                   </SelectContent>
                </Select>
                {#if $errors.entryMethod}<p class="text-red-500 text-sm mt-1">{$errors.entryMethod}</p>{/if}
              </div>

              <div></div> <!-- Spacer -->

              <!-- Start Odometer Image -->
              <div class="space-y-2">
                <Label for="startImage">Start Odometer Image</Label>
                {#if log.startImageUrl && !removeExistingStartImage}
                  <div class="flex items-center space-x-2 text-sm">
                    <span>Current Image</span>
                    <Button type="button" variant="outline" size="sm" on:click={() => viewExistingImage(log.startImageUrl)} class="h-7 px-2">
                      <Eye class="h-3 w-3 mr-1"/> View
                    </Button>
                    <label class="flex items-center space-x-1 cursor-pointer">
                      <Checkbox id="removeStartImage" bind:checked={removeExistingStartImage} on:change={() => { if(removeExistingStartImage) startImageFile = null; }}/>
                      <span class="text-xs">Remove</span>
                    </label>
                  </div>
                {/if}
                {#if !removeExistingStartImage}
                  <Input id="startImage" type="file" accept="image/*" on:change={(e) => handleFileSelect(e, 'start')} class="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  {#if startImageFile}<p class="text-sm text-gray-600 mt-1">New: {startImageFile.name}</p>{/if}
                {:else}
                   <p class="text-sm text-red-600 mt-1">Existing image will be removed upon saving.</p>
                {/if}
              </div>

              <!-- End Odometer Image -->
              <div class="space-y-2">
                <Label for="endImage">End Odometer Image</Label>
                 {#if log.endImageUrl && !removeExistingEndImage}
                  <div class="flex items-center space-x-2 text-sm">
                    <span>Current Image</span>
                    <Button type="button" variant="outline" size="sm" on:click={() => viewExistingImage(log.endImageUrl)} class="h-7 px-2">
                      <Eye class="h-3 w-3 mr-1"/> View
                    </Button>
                    <label class="flex items-center space-x-1 cursor-pointer">
                      <Checkbox id="removeEndImage" bind:checked={removeExistingEndImage} on:change={() => { if(removeExistingEndImage) endImageFile = null; }}/>
                      <span class="text-xs">Remove</span>
                    </label>
                  </div>
                {/if}
                 {#if !removeExistingEndImage}
                  <Input id="endImage" type="file" accept="image/*" on:change={(e) => handleFileSelect(e, 'end')} class="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                  {#if endImageFile}<p class="text-sm text-gray-600 mt-1">New: {endImageFile.name}</p>{/if}
                 {:else}
                    <p class="text-sm text-red-600 mt-1">Existing image will be removed upon saving.</p>
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
                  <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Updating...
                {:else}
                  Update Mileage Log
                {/if}
              </Button>
           </CardFooter>

         </form>
       {:else}
          <p>Mileage log data not available.</p>
          <a href="/mileage" class="text-blue-600 hover:underline mt-2 block">Back to Mileage Logs</a>
       {/if}
    </CardContent>
  </Card>
</div>