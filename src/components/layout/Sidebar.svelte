<script lang="ts">
  import { page } from '$app/stores';
  
  // Define sidebar navigation items
  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: 'dashboard' 
    },
    { 
      label: 'Expenses', 
      href: '/expenses', 
      icon: 'receipt',
      subItems: [
        { label: 'All Expenses', href: '/expenses' },
        { label: 'Add Expense', href: '/expenses/add' },
        { label: 'Categories', href: '/expenses/categories' }
      ]
    },
    { 
      label: 'Trips', 
      href: '/trips', 
      icon: 'luggage',
      subItems: [
        { label: 'All Trips', href: '/trips' },
        { label: 'Add Trip', href: '/trips/add' }
      ]
    },
    { 
      label: 'Mileage', 
      href: '/mileage', 
      icon: 'directions_car',
      subItems: [
        { label: 'Mileage Logs', href: '/mileage' },
        { label: 'Add Log', href: '/mileage/add' }
      ]
    },
    { 
      label: 'Reports', 
      href: '/reports', 
      icon: 'bar_chart' 
    },
    { 
      label: 'Settings', 
      href: '/settings', 
      icon: 'settings' 
    }
  ];
  
  // Track expanded state for each nav item
  let expanded = navItems.reduce((acc, item, index) => {
    // Auto-expand the current section
    acc[index] = $page.url.pathname.includes(item.href);
    return acc;
  }, {} as Record<number, boolean>);
  
  // Toggle expanded state
  function toggleExpanded(index: number) {
    expanded[index] = !expanded[index];
  }
  
  // Check if a nav item is active
  function isActive(href: string) {
    return $page.url.pathname === href || 
           ($page.url.pathname !== '/' && $page.url.pathname.includes(href) && href !== '/');
  }
</script>

<aside class="sidebar">
  <nav class="sidebar-nav">
    <ul class="nav-list">
      {#each navItems as item, i}
        <li class="nav-item" class:active={isActive(item.href)}>
          <a 
            href={item.href} 
            class="nav-link"
            on:click|preventDefault={() => {
              if (item.subItems) {
                toggleExpanded(i);
              } else {
                window.location.href = item.href;
              }
            }}
          >
            <span class="icon">{item.icon}</span>
            <span class="label">{item.label}</span>
            {#if item.subItems}
              <span class="expand-icon">{expanded[i] ? '▼' : '▶'}</span>
            {/if}
          </a>
          
          {#if item.subItems && expanded[i]}
            <ul class="sub-nav-list">
              {#each item.subItems as subItem}
                <li class="sub-nav-item" class:active={isActive(subItem.href)}>
                  <a href={subItem.href} class="sub-nav-link">
                    <span class="label">{subItem.label}</span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  </nav>
</aside>

<style>
  .sidebar {
    width: 250px;
    background-color: var(--surface-color);
    border-right: 1px solid var(--border-color);
    height: 100%;
    overflow-y: auto;
  }
  
  .sidebar-nav {
    padding: 1rem 0;
  }
  
  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .nav-item {
    margin: 0.25rem 0;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: var(--text-color);
    text-decoration: none;
    border-radius: var(--radius);
    margin: 0 0.5rem;
    transition: background-color 0.2s;
  }
  
  .nav-link:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .nav-item.active > .nav-link {
    background-color: rgba(59, 130, 246, 0.1);
    color: var(--primary-color);
    font-weight: 500;
  }
  
  .icon {
    margin-right: 0.75rem;
    font-size: 1.25rem;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .label {
    flex: 1;
  }
  
  .expand-icon {
    font-size: 0.75rem;
  }
  
  .sub-nav-list {
    list-style: none;
    margin: 0.25rem 0 0.25rem 2.5rem;
    padding: 0;
  }
  
  .sub-nav-item {
    margin: 0.125rem 0;
  }
  
  .sub-nav-link {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    color: var(--text-color);
    text-decoration: none;
    border-radius: var(--radius);
    transition: background-color 0.2s;
    font-size: 0.9rem;
  }
  
  .sub-nav-link:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  .sub-nav-item.active > .sub-nav-link {
    color: var(--primary-color);
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .sidebar {
      width: 60px;
    }
    
    .label, .expand-icon {
      display: none;
    }
    
    .icon {
      margin-right: 0;
    }
    
    .nav-link {
      justify-content: center;
      padding: 0.75rem;
    }
    
    .sub-nav-list {
      display: none;
    }
  }
</style>