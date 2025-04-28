<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';

  export let redirectTo = '/auth/login';
  
  let isAuthenticated = false;
  let isLoading = true;

  onMount(() => {
    const unsubscribe = authStore.subscribe(({ user, loading }) => {
      isLoading = loading;
      isAuthenticated = !!user;
      
      if (!loading && !user) {
        goto(redirectTo);
      }
    });

    return () => {
      unsubscribe();
    };
  });
</script>

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
{:else if isAuthenticated}
  <slot />
{/if}