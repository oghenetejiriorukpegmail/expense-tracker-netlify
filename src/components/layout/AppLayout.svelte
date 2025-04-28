<script lang="ts">
  import { page } from '$app/stores';
  import { isAuthenticated, isLoading } from '$lib/stores/auth';
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import Footer from './Footer.svelte';
  
  // Determine if the sidebar should be shown
  $: showSidebar = $isAuthenticated && !$page.url.pathname.includes('/auth');
</script>

<div class="app-layout">
  <Header />
  
  <div class="main-container">
    {#if showSidebar}
      <Sidebar />
    {/if}
    
    <main class="content">
      {#if $isLoading}
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      {:else}
        <slot />
      {/if}
    </main>
  </div>
  
  <Footer />
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .main-container {
    display: flex;
    flex: 1;
  }
  
  .content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }
  
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