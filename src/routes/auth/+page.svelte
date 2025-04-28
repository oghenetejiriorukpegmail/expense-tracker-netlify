<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth'; // Use authStore for reactive state
  import { signIn, signUp, resetPassword, signInWithGoogle } from '$lib/auth/auth-service';
  import { goto } from '$app/navigation';

  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Separator } from '$lib/components/ui/separator';

  // Assuming lucide-svelte
  import { Loader2, AlertCircle, Mail } from 'lucide-svelte';

  // Form state
  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let isSignUp = false;
  let isForgotPassword = false;
  let successMessage = '';

  // Use store for loading and error state
  $: loading = $authStore.loading;
  $: error = $authStore.error?.message || ''; // Get error message from store

  // Clear error when switching forms
  function clearState() {
      authStore.clearError();
      successMessage = '';
  }

  function toggleForm() {
    isSignUp = !isSignUp;
    isForgotPassword = false;
    clearState();
  }

  function toggleForgotPassword() {
    isForgotPassword = !isForgotPassword;
    isSignUp = false; // Ensure not in signup mode when switching to forgot password
    clearState();
  }
// Handle form submission
async function handleSubmit() {
  clearState();

  // Basic client-side validation (can be enhanced with Zod/form library if needed)
  if (!email) {
    authStore.setError(new Error('Email is required'));
    return;
  }
  if (!isForgotPassword && !password) {
     authStore.setError(new Error('Password is required'));
    return;
  }
  if (isSignUp && password !== confirmPassword) {
     authStore.setError(new Error('Passwords do not match'));
    return;
  }

  try {
    if (isForgotPassword) {
      await resetPassword(email);
      successMessage = 'Password reset email sent. Check your inbox.';
    } else if (isSignUp) {
      await signUp(email, password, displayName);
      // Auth store listener will handle redirect via onMount check
      successMessage = 'Account created successfully! Redirecting...';
       setTimeout(() => {
         if ($authStore.user) goto('/dashboard'); // Use goto for navigation
       }, 1500);
    } else {
      await signIn(email, password);
      // Auth store listener will handle redirect via onMount check
    }
  } catch (err) {
    // Error is already set in the store by auth-service
    console.error("Auth error:", err);
  }
  // Loading state is handled by the store
}

// Handle Google sign-in
async function handleGoogleSignIn() {
  clearState();
  try {
    await signInWithGoogle();
    // Auth store listener will handle redirect via onMount check
  } catch (err) {
    // Error is already set in the store by auth-service
    console.error("Google sign-in error:", err);
  }
}

  // Redirect if already authenticated
  // Use $: reactive statement for better handling if auth state changes while on page
  $: if ($authStore.user && !loading) {
      console.log('User already authenticated, redirecting to dashboard...');
      goto('/dashboard');
  }

</script>

<div class="flex justify-center items-center min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl">
        {#if isForgotPassword}
          Reset Password
        {:else if isSignUp}
          Create Account
        {:else}
          Sign In
        {/if}
      </CardTitle>
      <CardDescription>
        {#if isForgotPassword}
          Enter your email to receive a password reset link.
        {:else if isSignUp}
          Create a new account to get started.
        {:else}
          Sign in to your account to continue.
        {/if}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
        {#if error}
          <Alert variant="destructive">
             <AlertCircle class="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
          </Alert>
        {/if}

        {#if successMessage}
          <Alert variant="default" class="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
             <!-- CheckCircle icon would be good here -->
             <AlertTitle>Success</AlertTitle>
             <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        {/if}

        <div class="space-y-2">
          <Label for_id="email">Email</Label>
          <Input
            type="email"
            id="email"
            bind:value={email}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
        </div>

        {#if !isForgotPassword}
          <div class="space-y-2">
            <Label for_id="password">Password</Label>
            <Input
              type="password"
              id="password"
              bind:value={password}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>
        {/if}

        {#if isSignUp}
          <div class="space-y-2">
            <Label for_id="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              bind:value={confirmPassword}
              placeholder="Confirm your password"
              disabled={loading}
              required
            />
          </div>

          <div class="space-y-2">
            <Label for_id="displayName">Display Name (Optional)</Label>
            <Input
              type="text"
              id="displayName"
              bind:value={displayName}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>
        {/if}

        <Button
          type="submit"
          class="w-full"
          disabled={loading}
        >
          {#if loading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}

          {#if isForgotPassword}
            Send Reset Link
          {:else if isSignUp}
            Create Account
          {:else}
            Sign In
          {/if}
        </Button>

        {#if !isForgotPassword}
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <Separator class="w-full" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            class="w-full"
            on:click={handleGoogleSignIn}
            disabled={loading}
          >
            {#if loading}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {:else}
              <svg class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2970142 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
              </svg>
              <span>Sign in with Google</span>
            {/if}
          </Button>
        {/if}
      </form>
    </CardContent>
     <CardFooter class="flex flex-col items-center space-y-2 pt-4">
        {#if isForgotPassword}
          <Button variant="link" class="text-sm" on:click={toggleForgotPassword} disabled={loading}>
            Back to Sign In
          </Button>
        {:else}
          <Button variant="link" class="text-sm" on:click={toggleForm} disabled={loading}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Button>

          {#if !isSignUp}
            <Button variant="link" class="text-sm" on:click={toggleForgotPassword} disabled={loading}>
              Forgot Password?
            </Button>
          {/if}
        {/if}
      </CardFooter>
  </Card>
</div>