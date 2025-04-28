<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = authStore.subscribe(({ user }) => {
      if (!user) {
        goto('/login');
      }
    });

    return () => unsubscribe();
  });
</script>

{#if $page.data.user}
  <slot />
{:else}
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div class="mb-4 text-2xl font-semibold text-gray-700">Loading...</div>
      <div class="text-gray-500">Please wait while we verify your authentication.</div>
    </div>
  </div>
{/if}