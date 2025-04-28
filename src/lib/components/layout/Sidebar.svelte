<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser, isAuthenticated } from '$lib/stores/auth';
  import { theme, toggleTheme } from '$lib/stores/settings';
  import { signOut } from '$lib/auth/auth-service';

  // Assuming shadcn-svelte & lucide-svelte
  import { Button } from '$lib/components/ui/button';
  import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
  import {
    LayoutDashboard, // Home/Dashboard icon
    Briefcase,     // Trips icon
    Receipt,       // Expenses icon
    Car,           // Mileage icon
    User,          // Profile icon
    Settings,      // Settings icon
    LogOut,
    Moon,
    Sun,
    Laptop,        // System theme icon
    Menu,          // Mobile toggle icon
    X             // Mobile close icon
  } from 'lucide-svelte';

  // Props & Events for mobile state (to be managed by parent layout)
  export let isOpen = false; // Controls visibility on mobile
  const dispatch = createEventDispatcher<{ toggle: void }>();

  function closeSidebar() {
      // Only dispatch toggle if it's currently open (on mobile)
      if (isOpen) {
          dispatch('toggle');
      }
  }

  function navigateAndClose(path: string) {
    goto(path);
    closeSidebar();
  }

  async function handleSignOut() {
      closeSidebar();
      try {
          await signOut();
          goto('/auth'); // Redirect to auth page after sign out
      } catch (error) {
          console.error("Sign out error:", error);
          // TODO: Show error toast
      }
  }

  function getThemeIcon(currentTheme: string) {
      if (currentTheme === 'light') return Sun;
      if (currentTheme === 'dark') return Moon;
      return Laptop;
  }

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/trips', label: 'Trips', icon: Briefcase },
    { path: '/expenses', label: 'Expenses', icon: Receipt },
    { path: '/mileage', label: 'Mileage Logs', icon: Car },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

</script>

<!-- Sidebar -->
<!-- Base classes + conditional classes for mobile open/close state -->
<aside class={`bg-card text-card-foreground border-r w-64 flex-shrink-0 flex flex-col h-screen transition-transform duration-300 ease-in-out fixed md:sticky top-0 left-0 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

  <!-- Logo/Header -->
  <div class="p-4 border-b h-16 flex items-center justify-between">
    <a href="/" class="flex items-center space-x-2" on:click|preventDefault={() => navigateAndClose('/')}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 class="text-xl font-bold">ExpenseTracker</h1>
    </a>
     <!-- Close button for mobile -->
     <Button variant="ghost" size="icon" class="md:hidden" on:click={closeSidebar}>
        <X class="h-6 w-6" />
     </Button>
  </div>

  <!-- User Info / Auth Section -->
  <div class="p-4 border-b">
    {#if $isAuthenticated && $currentUser}
      <div class="flex items-center space-x-3">
         <Avatar class="h-10 w-10">
            <AvatarImage src={$currentUser.photoURL || undefined} alt={$currentUser.displayName || 'User'} />
            <AvatarFallback>{($currentUser.displayName || $currentUser.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
         </Avatar>
         <div>
            <p class="font-semibold text-sm">{$currentUser.displayName || 'User'}</p>
            <p class="text-xs text-muted-foreground">{$currentUser.email}</p>
         </div>
      </div>
       <Button variant="outline" size="sm" class="w-full mt-3" on:click={handleSignOut}>
          <LogOut class="mr-2 h-4 w-4" /> Sign Out
       </Button>
    {:else}
       <Button class="w-full" on:click={() => navigateAndClose('/auth')}>Sign In / Sign Up</Button>
    {/if}
  </div>

  <!-- Navigation -->
  <nav class="p-2 space-y-1 flex-grow overflow-y-auto">
    {#each navItems as item (item.path)}
      <Button
        variant={$page.url.pathname === item.path || (item.path !== '/' && $page.url.pathname.startsWith(item.path)) ? 'secondary' : 'ghost'}
        class="w-full justify-start"
        on:click={() => navigateAndClose(item.path)}
      >
        <svelte:component this={item.icon} class="mr-3 h-5 w-5" />
        <span>{item.label}</span>
      </Button>
    {/each}
  </nav>

  <!-- Footer Actions (Theme Toggle) -->
  <div class="mt-auto p-4 border-t">
    <Button variant="ghost" class="w-full justify-start" on:click={toggleTheme}>
      <svelte:component this={getThemeIcon($theme)} class="mr-2 h-5 w-5" />
      {#if $theme === 'light'} Switch to Dark
      {:else if $theme === 'dark'} Use System Theme
      {:else} Switch to Light
      {/if}
    </Button>
  </div>
</aside>

<!-- Overlay for mobile -->
{#if isOpen}
    <div aria-hidden="true" class="fixed inset-0 bg-black/50 z-40 md:hidden" on:click={closeSidebar}></div>
{/if}