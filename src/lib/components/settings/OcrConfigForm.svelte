<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { onMount } from 'svelte';
  import { api } from '$lib/api/client';
  import { ocrMethod, ocrApiKey, ocrTemplate, updateOcrSettings } from '$lib/stores/settings'; // Import store values and update function

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
  import { FormField } from '$lib/components/ui/form'; // Assuming FormField exists or adapt

  // Assuming lucide-svelte
  import { Loader2 } from 'lucide-svelte';

  // --- Schema ---
  // Note: Only allowing 'travel' template as per original React code? Or allow 'general'? Let's allow both for now.
  const ocrSettingsSchema = z.object({
    ocrMethod: z.string().min(1, "OCR Method is required"), // Could use z.enum if methods are fixed
    ocrApiKey: z.string().optional(),
    ocrTemplate: z.enum(['travel', 'general']), // Allow both templates
  }).refine(data => data.ocrMethod === 'tesseract' || (data.ocrApiKey && data.ocrApiKey.trim() !== ''), {
      message: "API Key is required for the selected OCR method",
      path: ["ocrApiKey"], // Apply error to API key field
  });

  type OcrSettingsFormData = z.infer<typeof ocrSettingsSchema>;

  // --- State ---
  let currentOcrMethod: string;
  let currentOcrApiKey: string | null;
  let currentOcrTemplate: string;
  let isTesting = false;
  let testResult: { success: boolean; message: string } | null = null;
  let submitError: string | null = null;

  // Subscribe to store values
  const unsubOcrMethod = ocrMethod.subscribe(value => { currentOcrMethod = value; });
  const unsubOcrApiKey = ocrApiKey.subscribe(value => { currentOcrApiKey = value; });
  const unsubOcrTemplate = ocrTemplate.subscribe(value => { currentOcrTemplate = value; });

  // --- Form Setup ---
  const { form, handleSubmit, handleChange, isSubmitting, errors, reset } = createForm({
    initialValues: {
      ocrMethod: currentOcrMethod || 'gemini',
      ocrApiKey: currentOcrApiKey || '',
      ocrTemplate: currentOcrTemplate || 'general',
    },
    validationSchema: zod(ocrSettingsSchema),
    onSubmit: async (values) => {
      await handleSaveSettings(values);
    }
  });

  // Keep form synced with store if store changes externally (e.g., on load)
   $: if (currentOcrMethod !== $form.ocrMethod || currentOcrApiKey !== $form.ocrApiKey || currentOcrTemplate !== $form.ocrTemplate) {
       reset({
           ocrMethod: currentOcrMethod || 'gemini',
           ocrApiKey: currentOcrApiKey || '',
           ocrTemplate: currentOcrTemplate || 'general',
       });
   }

  // --- API Calls ---
  async function handleSaveSettings(values: OcrSettingsFormData) {
    submitError = null;
    testResult = null;
    try {
      // TODO: Verify '/api/update-env' endpoint and payload structure
      await api.post("/api/update-env", {
        ocrMethod: values.ocrMethod,
        apiKey: values.ocrApiKey, // Send API key
        ocrTemplate: values.ocrTemplate,
      });
      // Update store on success
      updateOcrSettings(values.ocrMethod, values.ocrApiKey || null, values.ocrTemplate);
      // TODO: Show success toast
      console.log("OCR Settings Saved!");
    } catch (error) {
      submitError = error instanceof Error ? error.message : "Failed to save settings";
      // TODO: Show error toast
      console.error("Error saving OCR settings:", error);
    }
  }

  async function testOcrSettings() {
    isTesting = true;
    submitError = null;
    testResult = null;
    const values = $form; // Get current form values

    // Ensure API key is provided if needed before testing
     const validation = ocrSettingsSchema.safeParse(values);
     if (!validation.success) {
         // Manually trigger display of validation errors if needed by form lib
         console.error("Validation failed before test:", validation.error.flatten().fieldErrors);
         submitError = "Please fix validation errors before testing.";
         isTesting = false;
         return;
     }


    try {
      // TODO: Verify '/api/test-ocr' endpoint and payload structure
      const data = await api.post<{ success: boolean; message: string }>("/api/test-ocr", {
        method: values.ocrMethod,
        apiKey: values.ocrApiKey,
      });
      testResult = data;
      // TODO: Show toast based on testResult
      console.log("OCR Test Result:", data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error during test";
      testResult = { success: false, message };
      // TODO: Show error toast
      console.error("Error testing OCR settings:", error);
    } finally {
      isTesting = false;
    }
  }

  // --- Lifecycle ---
  onMount(() => {
    // Ensure form is initialized with current store values on mount
     reset({
           ocrMethod: currentOcrMethod || 'gemini',
           ocrApiKey: currentOcrApiKey || '',
           ocrTemplate: currentOcrTemplate || 'general',
       });
  });

  onDestroy(() => {
    // Unsubscribe from stores
    unsubOcrMethod();
    unsubOcrApiKey();
    unsubOcrTemplate();
  });

  // Options
  const ocrMethodOptions = ['gemini', 'openai', 'claude', 'openrouter']; // Add tesseract if supported
  const ocrTemplateOptions = ['general', 'travel'];

</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
  <!-- OCR Method -->
  <div>
    <Label for="ocrMethod">OCR Method</Label>
    <Select name="ocrMethod" onValueChange={(val) => {
        handleChange({ target: { name: 'ocrMethod', value: val } });
        // Clear API key if switching to a method that doesn't need one (e.g., tesseract if added)
        // if (val === 'tesseract') handleChange({ target: { name: 'ocrApiKey', value: '' } });
    }} value={$form.ocrMethod}>
      <SelectTrigger id="ocrMethod" class={$errors.ocrMethod ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select OCR method" />
      </SelectTrigger>
      <SelectContent>
        {#each ocrMethodOptions as methodOpt}
          <SelectItem value={methodOpt}>{methodOpt.charAt(0).toUpperCase() + methodOpt.slice(1)}</SelectItem>
        {/each}
      </SelectContent>
    </Select>
    <p class="text-sm text-gray-500 mt-1">Select the OCR service for data extraction.</p>
    {#if $errors.ocrMethod}<p class="text-red-500 text-sm mt-1">{$errors.ocrMethod}</p>{/if}
  </div>

  <!-- API Key -->
  {#if $form.ocrMethod !== 'tesseract'} <!-- Conditionally show API key -->
    <div>
      <Label for="ocrApiKey">API Key</Label>
      <Input id="ocrApiKey" type="password" name="ocrApiKey" placeholder="Enter API key" use:form on:change={handleChange} bind:value={$form.ocrApiKey} class={$errors.ocrApiKey ? 'border-red-500' : ''} />
      <p class="text-sm text-gray-500 mt-1">Enter your {$form.ocrMethod} API key.</p>
      {#if $errors.ocrApiKey}<p class="text-red-500 text-sm mt-1">{$errors.ocrApiKey}</p>{/if}
    </div>
  {/if}

  <!-- OCR Template -->
  <div>
    <Label for="ocrTemplate">OCR Data Extraction Template</Label>
    <Select name="ocrTemplate" onValueChange={(val) => handleChange({ target: { name: 'ocrTemplate', value: val } })} value={$form.ocrTemplate}>
      <SelectTrigger id="ocrTemplate" class={$errors.ocrTemplate ? 'border-red-500' : ''}>
        <SelectValue placeholder="Select template" />
      </SelectTrigger>
      <SelectContent>
         {#each ocrTemplateOptions as templateOpt}
          <SelectItem value={templateOpt}>{templateOpt.charAt(0).toUpperCase() + templateOpt.slice(1)}</SelectItem>
        {/each}
      </SelectContent>
    </Select>
    <p class="text-sm text-gray-500 mt-1">Choose a template to guide AI data extraction.</p>
    {#if $errors.ocrTemplate}<p class="text-red-500 text-sm mt-1">{$errors.ocrTemplate}</p>{/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex space-x-3">
    <Button type="submit" disabled={$isSubmitting || isTesting}>
      {#if $isSubmitting}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
      {:else}
        Save OCR Settings
      {/if}
    </Button>
    <Button type="button" variant="outline" on:click={testOcrSettings} disabled={$isSubmitting || isTesting}>
      {#if isTesting}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Testing...
      {:else}
        Test OCR
      {/if}
    </Button>
  </div>

   <!-- Submission/Test Results -->
   {#if submitError}
     <p class="text-red-600 text-sm">{submitError}</p>
   {/if}
   {#if testResult}
      <p class="text-sm {testResult.success ? 'text-green-600' : 'text-red-600'}">
         Test Result: {testResult.message}
      </p>
   {/if}

</form>