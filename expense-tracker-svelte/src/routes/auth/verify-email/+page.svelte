<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/firebase';
  import { applyActionCode } from 'firebase/auth';

  let error: string | null = null;
  let loading = true;
  let verified = false;

  onMount(async () => {
    const oobCode = $page.url.searchParams.get('oobCode');
    
    if (!oobCode) {
      error = 'Invalid verification link';
      loading = false;
      return;
    }

    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }
      await applyActionCode(auth, oobCode);
      verified = true;
      setTimeout(() => {
        goto('/auth/login');
      }, 3000);
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    {#if loading}
      <div class="flex justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    {:else if error}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              Verification failed
            </h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div class="mt-4">
              <a
                href="/auth/login"
                class="text-sm font-medium text-red-800 hover:text-red-700"
              >
                Return to login
              </a>
            </div>
          </div>
        </div>
      </div>
    {:else if verified}
      <div class="rounded-md bg-green-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Email verified successfully
            </h3>
            <div class="mt-2 text-sm text-green-700">
              <p>Redirecting you to login...</p>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>