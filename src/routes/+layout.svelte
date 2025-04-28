<script lang="ts">
  import '../app.css'; // Global styles
  import { onMount } from 'svelte';
  import { initAuth } from '$lib/auth/auth-service';
  import { currentUser, isAuthenticated, authStore } from '$lib/stores/auth';
  import { theme } from '$lib/stores/settings';
  import Sidebar from '$lib/components/layout/Sidebar.svelte'; // Import Sidebar
  import { Button } from '$lib/components/ui/button'; // For mobile toggle
  import { Menu } from 'lucide-svelte'; // Mobile menu icon

  // State for mobile sidebar
  let isSidebarOpen = false;

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  // Initialize Firebase Auth listener
  onMount(() => {
    const unsubscribe = initAuth();
    console.log('Current theme:', $theme); // Ensure theme store is accessed
    return () => unsubscribe();
  });

  // TODO: Import and use actual Header/Footer components if needed

</script>

<!-- Apply theme class dynamically -->
<div class="app flex min-h-screen bg-background text-foreground">

  <!-- Sidebar -->
  <Sidebar bind:isOpen={isSidebarOpen} on:toggle={toggleSidebar} />

  <!-- Main Content Area -->
  <div class="flex flex-col flex-1">

    <!-- Header (Simplified - integrate actual Header component later) -->
    <header class="bg-card text-card-foreground border-b p-4 shadow-sm sticky top-0 z-30 flex items-center justify-between md:justify-end">
       <!-- Mobile Menu Toggle -->
       <Button variant="ghost" size="icon" class="md:hidden" on:click={toggleSidebar}>
          <Menu class="h-6 w-6" />
       </Button>

       <!-- Header content (e.g., User menu, notifications) -->
       <div class="flex items-center space-x-4">
          {#if $isAuthenticated && $currentUser}
             <span>{$currentUser.displayName || $currentUser.email}</span>
             <!-- TODO: Add UserButton/Dropdown here -->
          {:else if !$authStore.loading}
             <a href="/auth"><Button variant="outline" size="sm">Sign In</Button></a>
          {/if}
       </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 p-4 md:p-6 overflow-y-auto">
       {#if $authStore.loading}
          <div class="flex justify-center items-center h-64">
             <p>Initializing...</p> <!-- Or a spinner -->
          </div>
       {:else}
          <slot /> <!-- Page content renders here -->
       {/if}
    </main>

    <!-- Footer (Simplified - integrate actual Footer component later) -->
    <footer class="bg-card text-muted-foreground border-t p-4 text-center text-xs">
      © {new Date().getFullYear()} Expense Tracker.
    </footer>

  </div>

</div>

<style>
  /* Add any layout-specific styles here if needed */
</style>