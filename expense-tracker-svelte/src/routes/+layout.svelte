<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import '../app.css';

  // List of routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/expenses',
    '/settings',
    '/profile'
  ];

  // List of auth routes where authenticated users shouldn't be
  const authRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password'
  ];

  let isLoading = true;
  let error: string | null = null;
  let unsubscribe: () => void;

  onMount(() => {
    unsubscribe = authStore.subscribe(({ user, loading, error: authError }) => {
      isLoading = loading;
      error = authError;

      if (!loading) {
        const currentPath = $page.url.pathname;
        
        // Redirect authenticated users away from auth routes
        if (user && authRoutes.some(route => currentPath.startsWith(route))) {
          goto('/dashboard');
        }
        
        // Redirect unauthenticated users away from protected routes
        if (!user && protectedRoutes.some(route => currentPath.startsWith(route))) {
          goto('/auth/login');
        }
      }
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    authStore.destroy();
  });
</script>

<main class="min-h-screen">
  {#if isLoading}
    <div class="flex items-center justify-center min-h-screen bg-base-100">
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p class="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-screen bg-base-100">
      <div class="bg-error/10 text-error p-4 rounded-lg max-w-md">
        <h3 class="font-semibold mb-2">Authentication Error</h3>
        <p>{error}</p>
      </div>
    </div>
  {:else}
    <slot />
  {/if}
</main>