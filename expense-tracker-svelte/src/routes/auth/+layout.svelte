<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = authStore.subscribe(({ user, loading }) => {
      if (!loading && user) {
        goto('/dashboard');
      }
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<div class="min-h-screen bg-gray-50">
  <div class="flex flex-col items-center">
    <div class="w-full max-w-md px-4 py-8">
      <div class="mb-8 text-center">
        <a href="/" class="text-2xl font-bold text-primary">
          Expense Tracker
        </a>
      </div>
      
      <slot />
    </div>
  </div>
</div>