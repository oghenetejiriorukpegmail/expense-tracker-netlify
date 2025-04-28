import { api } from '$lib/api/client';
import type { MileageLog } from '../../../shared/schema'; // Adjust path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit';

export const load = async ({ fetch }: PageLoadEvent) => {
  if (!browser) {
    return { mileageLogs: [], loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  try {
    // TODO: Add filtering options (e.g., tripId) if needed
    const mileageLogs = await api.get<MileageLog[]>('/mileage-logs');
    return {
      mileageLogs,
      loading: false
    };
  } catch (error) {
    console.error('Failed to load mileage logs:', error);
    if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
    }
    throw svelteKitError(500, 'Failed to load mileage logs.');
  }
};

export const ssr = false; // Disable SSR for now