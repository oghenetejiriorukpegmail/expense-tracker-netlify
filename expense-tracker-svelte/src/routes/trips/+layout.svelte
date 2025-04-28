<script lang="ts">
import { page } from '$app/stores';
import { tripStore } from '$lib/stores/tripStore';

// Generate breadcrumbs based on current route
$: breadcrumbs = (() => {
  const segments = $page.url.pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Trips', href: '/trips' }];
  
  if (segments.length > 1) {
    const tripId = segments[1];
    const trip = $tripStore.trips.find(t => t.id === parseInt(tripId));
    
    if (trip) {
      crumbs.push({ label: trip.title, href: `/trips/${tripId}` });
      
      if (segments[2] === 'expenses') {
        crumbs.push({ label: 'Expenses', href: `/trips/${tripId}/expenses` });
        
        if (segments[3] === 'new') {
          crumbs.push({ label: 'New Expense', href: `/trips/${tripId}/expenses/new` });
        }
      } else if (segments[2] === 'edit') {
        crumbs.push({ label: 'Edit', href: `/trips/${tripId}/edit` });
      }
    }
  } else if (segments[1] === 'new') {
    crumbs.push({ label: 'New Trip', href: '/trips/new' });
  }
  
  return crumbs;
})();
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Breadcrumbs -->
  <nav class="bg-white border-b border-gray-200 px-4 py-3">
    <div class="container mx-auto">
      <div class="flex items-center space-x-2 text-sm text-gray-500">
        {#each breadcrumbs as crumb, i}
          {#if i > 0}
            <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
          <a
            href={crumb.href}
            class={i === breadcrumbs.length - 1
              ? 'font-medium text-gray-900'
              : 'hover:text-gray-700'
            }
          >
            {crumb.label}
          </a>
        {/each}
      </div>
    </div>
  </nav>

  <!-- Page content -->
  <main>
    <slot />
  </main>
</div>