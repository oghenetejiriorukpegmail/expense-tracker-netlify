<script lang="ts">
  import { createForm } from 'svelte-forms-lib';
  import * as z from 'zod';
  import { zod } from 'svelte-forms-lib/validators';
  import { api } from '$lib/api/client';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';

  // Assuming lucide-svelte
  import { Loader2 } from 'lucide-svelte';

  export let data: PageData;

  // Reactive state from load function
  $: ({ userProfile, error: loadError, loading } = data);

  // --- Schema ---
  // Email is usually not editable directly if used for login
  const profileFormSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    // email: z.string().email("Invalid email address"), // Make email read-only
    bio: z.string().optional(),
  });

  type ProfileFormData = z.infer<typeof profileFormSchema>;

  // --- Form Setup ---
  let formState: ReturnType<typeof createForm> | null = null;

  // Initialize form only when profile data is loaded
  $: if (userProfile && !formState) {
      formState = createForm({
          initialValues: {
              firstName: userProfile.firstName || "",
              lastName: userProfile.lastName || "",
              phoneNumber: userProfile.phoneNumber || "",
              // email: userProfile.email || "", // Don't include email in editable form values
              bio: userProfile.bio || "",
          },
          validationSchema: zod(profileFormSchema),
          onSubmit: async (values) => {
              await handleFormSubmit(values);
          }
      });
  }

  // --- State ---
  let submitError: string | null = null;
  // TODO: Implement toast notifications

  // --- Submission Logic ---
  async function handleFormSubmit(values: ProfileFormData) {
     if (!userProfile) return;
     submitError = null;
     try {
       // Prepare payload - only send editable fields
       const apiPayload = {
           firstName: values.firstName,
           lastName: values.lastName,
           phoneNumber: values.phoneNumber,
           bio: values.bio,
       };

       console.log("Updating profile data:", apiPayload);

       const updatedProfile = await api.put(`/profile`, apiPayload); // Use PUT

       console.log("Profile updated:", updatedProfile);
       // TODO: Show success toast

       await invalidateAll(); // Refresh profile data everywhere

     } catch (error) {
       console.error("Error updating profile:", error);
       submitError = error instanceof Error ? error.message : "An unknown error occurred";
       // TODO: Show error toast
     }
  }

</script>

<div class="p-4 md:p-8">
  <h1 class="text-2xl font-bold mb-6">Profile</h1>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Profile Form Card -->
    <div class="lg:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>Update your profile details.</CardDescription>
        </CardHeader>
        <CardContent>
          {#if loading}
            <div class="flex justify-center items-center p-10">
              <Loader2 class="h-8 w-8 animate-spin text-primary" />
            </div>
          {:else if loadError}
            <p class="text-red-500">Error loading profile: {loadError.message}</p>
          {:else if userProfile && formState}
            {@const { form, handleSubmit, handleChange, isSubmitting, errors } = formState}
            <form on:submit|preventDefault={handleSubmit} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- First Name -->
                <div>
                  <Label for="firstName">First Name <span class="text-red-500">*</span></Label>
                  <Input id="firstName" name="firstName" use:form on:change={handleChange} bind:value={$form.firstName} class={$errors.firstName ? 'border-red-500' : ''} />
                  {#if $errors.firstName}<p class="text-red-500 text-sm mt-1">{$errors.firstName}</p>{/if}
                </div>
                <!-- Last Name -->
                <div>
                  <Label for="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" use:form on:change={handleChange} bind:value={$form.lastName} class={$errors.lastName ? 'border-red-500' : ''} />
                  {#if $errors.lastName}<p class="text-red-500 text-sm mt-1">{$errors.lastName}</p>{/if}
                </div>
              </div>
              <!-- Phone Number -->
              <div>
                <Label for="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" placeholder="Your phone number" use:form on:change={handleChange} bind:value={$form.phoneNumber} class={$errors.phoneNumber ? 'border-red-500' : ''} />
                {#if $errors.phoneNumber}<p class="text-red-500 text-sm mt-1">{$errors.phoneNumber}</p>{/if}
              </div>
              <!-- Email (Read-only) -->
              <div>
                 <Label for="email">Email</Label>
                 <Input id="email" type="email" value={userProfile.email || ''} readonly disabled class="bg-gray-100 dark:bg-gray-700 cursor-not-allowed" />
                 <p class="text-xs text-gray-500 mt-1">Email cannot be changed here.</p>
              </div>
              <!-- Bio -->
              <div>
                <Label for="bio">Bio</Label>
                <Textarea id="bio" name="bio" placeholder="Tell us a little about yourself" use:form on:change={handleChange} bind:value={$form.bio} class={`min-h-[80px] ${$errors.bio ? 'border-red-500' : ''}`} />
                {#if $errors.bio}<p class="text-red-500 text-sm mt-1">{$errors.bio}</p>{/if}
              </div>

              {#if submitError}
                <p class="text-red-600 text-sm">{submitError}</p>
              {/if}

              <div class="flex justify-end">
                <Button type="submit" disabled={$isSubmitting}>
                  {#if $isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
                  {:else}
                    Save Changes
                  {/if}
                </Button>
              </div>
            </form>
          {:else}
            <p>Could not load profile data.</p>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Account Management Card -->
    <div class="lg:col-span-1">
       <Card>
         <CardHeader>
           <CardTitle>Account Management</CardTitle>
           <CardDescription>Manage security settings.</CardDescription>
         </CardHeader>
         <CardContent>
            <p class="text-sm text-gray-600 dark:text-gray-400">
                Password changes and other security settings are managed through your Firebase account.
            </p>
            <!-- TODO: Add link/button to trigger Firebase password reset email if possible/desired -->
             <Button variant="outline" class="mt-4 w-full" disabled>Manage Account (Coming Soon)</Button>
         </CardContent>
       </Card>
    </div>
  </div>
</div>