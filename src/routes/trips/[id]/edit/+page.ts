import { api } from '$lib/api/client';
import type { Trip } from '../../../../../shared/schema'; // Corrected relative path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit';

export const load = async ({ params, fetch }: PageLoadEvent) => {
  if (!browser) {
    return { trip: null, loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  const tripId = parseInt(params.id);
  if (isNaN(tripId)) {
     throw svelteKitError(400, 'Invalid trip ID');
  }

  try {
    const trip = await api.get<Trip>(`/trips/${tripId}`);
    if (!trip) {
        throw svelteKitError(404, 'Trip not found');
    }
    return {
      trip,
      loading: false
    };
  } catch (error) {
    console.error(`Failed to load trip ${tripId} for editing:`, error);
     if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
        if (status === 403) {
            throw svelteKitError(403, 'Forbidden: You do not have permission to edit this trip.');
        }
         if (status === 404) {
            throw svelteKitError(404, 'Trip not found');
        }
    }
    throw svelteKitError(500, 'Failed to load trip data.');
  }
};

export const ssr = false; // Disable SSR for now