<script lang="ts">
  import { onMount } from 'svelte';
  import { isAuthenticated, isLoading } from '$lib/stores/auth';
  
  export let redirect = '/auth';
  
  let isClient = false;
  
  onMount(() => {
    isClient = true;
    
    // If not authenticated and not loading, redirect to auth page
    if (isClient && !$isLoading && !$isAuthenticated) {
      window.location.href = redirect;
    }
  });
</script>

{#if isClient}
  {#if $isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  {:else if $isAuthenticated}
    <slot />
  {/if}
{/if}

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>