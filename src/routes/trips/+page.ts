import { api } from '$lib/api/client';
import type { Trip } from '../../../shared/schema'; // Adjust path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit';

export const load = async ({ fetch, url }: PageLoadEvent) => {
  if (!browser) {
    return { trips: [], loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  try {
    // Get filter parameters from URL
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const status = url.searchParams.get('status');
    
    // Build query string for API request
    let queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (status) queryParams.append('status', status);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/trips?${queryString}` : '/trips';
    
    const trips = await api.get<Trip[]>(endpoint);
    
    return {
      trips,
      loading: false,
      filters: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status
      }
    };
  } catch (error) {
    console.error('Failed to load trips:', error);
    if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
    }
    // Use svelteKitError to show error page
    throw svelteKitError(500, 'Failed to load trips.');
  }
};

export const ssr = false; // Disable SSR for now