<script lang="ts">
  import { page } from '$app/stores';
  import { isAuthenticated, user } from '$lib/stores/auth';
  import { signOut } from '$lib/auth/auth-service';
  
  // Handle sign out
  async function handleSignOut() {
    try {
      await signOut();
      // Navigate to auth page after sign out
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
</script>

<header class="header">
  <div class="container">
    <div class="logo">
      <a href="/">
        <h1>Expense Tracker</h1>
      </a>
    </div>
    
    <nav class="nav">
      {#if $isAuthenticated}
        <ul class="nav-list">
          <li class="nav-item" class:active={$page.url.pathname === '/dashboard'}>
            <a href="/dashboard">Dashboard</a>
          </li>
          <li class="nav-item" class:active={$page.url.pathname.includes('/expenses')}>
            <a href="/expenses">Expenses</a>
          </li>
          <li class="nav-item" class:active={$page.url.pathname.includes('/trips')}>
            <a href="/trips">Trips</a>
          </li>
          <li class="nav-item" class:active={$page.url.pathname.includes('/mileage')}>
            <a href="/mileage">Mileage</a>
          </li>
        </ul>
      {/if}
    </nav>
    
    <div class="user-menu">
      {#if $isAuthenticated && $user}
        <div class="user-info">
          <span class="user-name">{$user.displayName || $user.email}</span>
          <div class="dropdown">
            <button class="dropdown-button">
              <span class="avatar">
                {#if $user.photoURL}
                  <img src={$user.photoURL} alt={$user.displayName || 'User'} />
                {:else}
                  <div class="avatar-placeholder">
                    {($user.displayName?.[0] || $user.email?.[0] || '?').toUpperCase()}
                  </div>
                {/if}
              </span>
            </button>
            <div class="dropdown-content">
              <a href="/profile">Profile</a>
              <a href="/settings">Settings</a>
              <button on:click={handleSignOut} class="sign-out-button">Sign Out</button>
            </div>
          </div>
        </div>
      {:else if !$page.url.pathname.includes('/auth')}
        <a href="/auth" class="sign-in-button">Sign In</a>
      {/if}
    </div>
  </div>
</header>

<style>
  .header {
    background-color: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    padding: 0.5rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .logo a {
    text-decoration: none;
    color: var(--text-color);
  }
  
  .logo h1 {
    font-size: 1.5rem;
    margin: 0;
  }
  
  .nav-list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .nav-item {
    margin: 0 0.5rem;
  }
  
  .nav-item a {
    color: var(--text-color);
    text-decoration: none;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: background-color 0.2s;
  }
  
  .nav-item a:hover {
    background-color: var(--surface-color);
  }
  
  .nav-item.active a {
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .user-menu {
    display: flex;
    align-items: center;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    position: relative;
  }
  
  .user-name {
    margin-right: 0.5rem;
    font-weight: 500;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    background-color: var(--primary-color);
    color: white;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }
  
  .dropdown {
    position: relative;
    display: inline-block;
  }
  
  .dropdown-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  
  .dropdown-content {
    display: none;
    position: absolute;
    right: 0;
    background-color: var(--background-color);
    min-width: 160px;
    box-shadow: var(--shadow-md);
    border-radius: var(--radius);
    z-index: 1;
    border: 1px solid var(--border-color);
  }
  
  .dropdown-content a,
  .dropdown-content button {
    color: var(--text-color);
    padding: 0.75rem 1rem;
    text-decoration: none;
    display: block;
    text-align: left;
    background: none;
    border: none;
    width: 100%;
    font-size: 1rem;
    cursor: pointer;
  }
  
  .dropdown-content a:hover,
  .dropdown-content button:hover {
    background-color: var(--surface-color);
  }
  
  .dropdown:hover .dropdown-content {
    display: block;
  }
  
  .sign-in-button,
  .sign-out-button {
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    font-weight: 500;
  }
  
  .sign-in-button {
    background-color: var(--primary-color);
    color: white;
    text-decoration: none;
  }
  
  .sign-in-button:hover {
    background-color: var(--primary-hover);
  }
  
  .sign-out-button {
    color: var(--error-color);
  }
  
  @media (max-width: 768px) {
    .nav {
      display: none;
    }
    
    .user-name {
      display: none;
    }
  }
</style>