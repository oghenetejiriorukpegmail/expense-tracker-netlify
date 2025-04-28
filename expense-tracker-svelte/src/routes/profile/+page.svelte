<script lang="ts">
  import { onMount } from 'svelte';
  import { z } from 'zod';
  import { superForm } from 'sveltekit-superforms/client';
  import { toast } from '$lib/components/ui/toast';
  import { Loader2 } from 'lucide-svelte';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
  import { Card } from '$lib/components/ui/Card.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '$lib/components/ui/form';
  
  // Schema for profile update form validation
  const profileFormSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().email("Invalid email address"),
    bio: z.string().optional(),
  });
  
  type ProfileFormData = z.infer<typeof profileFormSchema>;
  
  let profile: ProfileFormData | null = null;
  let isLoading = true;
  let error: Error | null = null;
  
  // Initialize the form with superForm
  const { form, errors, enhance, submitting, reset } = superForm<ProfileFormData>({
    id: 'profile-form',
    validators: profileFormSchema,
    onSubmit: async ({ formData, cancel }) => {
      try {
        const token = $user?.token;
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'You must be logged in to update your profile',
            variant: 'destructive'
          });
          cancel();
          return;
        }
        
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(Object.fromEntries(formData))
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update profile');
        }
        
        const updatedProfile = await response.json();
        profile = updatedProfile;
        
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been saved successfully'
        });
      } catch (err) {
        toast({
          title: 'Update Failed',
          description: err instanceof Error ? err.message : 'An error occurred while updating your profile',
          variant: 'destructive'
        });
        cancel();
      }
    }
  });
  
  // Fetch profile data with retry mechanism
  async function fetchProfile(retryCount = 0, maxRetries = 2) {
    isLoading = true;
    error = null;
    
    try {
      const token = $user?.token;
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load profile data');
      }
      
      profile = await response.json();
      reset(profile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      
      // Implement retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * 2 ** retryCount, 10000);
        console.log(`Retrying profile fetch in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          fetchProfile(retryCount + 1, maxRetries);
        }, delay);
        return;
      }
      
      error = err instanceof Error ? err : new Error('An unknown error occurred');
    } finally {
      isLoading = false;
    }
  }
  
  // Check authentication and fetch profile on mount
  onMount(() => {
    if (!$user) {
      goto('/auth');
      return;
    }
    
    fetchProfile();
  });
</script>

<svelte:head>
  <title>Profile | Expense Tracker</title>
</svelte:head>

<div class="container mx-auto p-4 md:p-6">
  <h1 class="text-2xl font-bold mb-6">Profile</h1>
  
  <Card>
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-2">Your Information</h2>
      <p class="text-muted-foreground mb-6">Update your profile details.</p>
      
      {#if isLoading}
        <div class="flex justify-center items-center p-10">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
      {:else if error}
        <div class="text-red-600 p-4 bg-red-50 rounded border border-red-200">
          <p class="mb-2">Error loading profile: {error.message}</p>
          <Button
            variant="outline"
            size="sm"
            on:click={fetchProfile}
            class="mt-2"
          >
            Try Again
          </Button>
        </div>
      {:else if profile}
        <Form {form}>
          <form method="POST" use:enhance class="space-y-6">
            <!-- First Name and Last Name grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField {errors} name="firstName">
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input name="firstName" placeholder="Your first name" bind:value={$form.firstName} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              
              <FormField {errors} name="lastName">
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input name="lastName" placeholder="Your last name" bind:value={$form.lastName} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            
            <!-- Phone Number -->
            <FormField {errors} name="phoneNumber">
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input name="phoneNumber" placeholder="Your phone number" bind:value={$form.phoneNumber} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <!-- Email -->
            <FormField {errors} name="email">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input name="email" type="email" placeholder="your.email@example.com" bind:value={$form.email} />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <!-- Bio -->
            <FormField {errors} name="bio">
              <FormItem>
                <FormLabel>Bio (Optional)</FormLabel>
                <FormControl>
                  <Textarea name="bio" placeholder="Tell us a little about yourself" bind:value={$form.bio} />
                </FormControl>
                <FormDescription>A short description about you.</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <Button type="submit" disabled={$submitting}>
              {#if $submitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" /> Saving...
              {:else}
                Save Changes
              {/if}
            </Button>
          </form>
        </Form>
      {/if}
    </div>
  </Card>
  
  <!-- Password Change Card -->
  <Card class="mt-6">
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-2">Change Password</h2>
      <p class="text-muted-foreground mb-6">Update your account password.</p>
      
      <div class="text-center p-4">
        <p class="mb-4">Password changes are managed through your Firebase account settings.</p>
        <p class="mb-4">You can change your password and manage other account details through the Firebase authentication system.</p>
        
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" on:click={() => goto('/auth')}>
            Go to Authentication Page
          </Button>
          {#if $user}
            <Button variant="secondary" on:click={() => window.open('https://firebase.google.com/docs/auth/web/manage-users', '_blank')}>
              Firebase Account Help
            </Button>
            <Button variant="default" on:click={() => {
              if ($user?.email) {
                // Send password reset email
                import('$lib/firebase').then(({ auth, sendPasswordResetEmail }) => {
                  sendPasswordResetEmail(auth, $user.email)
                    .then(() => {
                      toast({
                        title: 'Password Reset Email Sent',
                        description: 'Check your email for instructions to reset your password.'
                      });
                    })
                    .catch((error) => {
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to send password reset email',
                        variant: 'destructive'
                      });
                    });
                });
              }
            }}>
              Reset Password
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </Card>
</div>