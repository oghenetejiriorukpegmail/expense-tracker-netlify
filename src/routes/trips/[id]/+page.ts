import { api } from '$lib/api/client';
import type { Trip, Expense } from '../../../../shared/schema'; // Adjust path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit';

export const load = async ({ params, fetch }: PageLoadEvent) => {
  if (!browser) {
    return { trip: null, expenses: [], loading: true };
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
    // Fetch trip details and expenses concurrently
    const [trip, expenses] = await Promise.all([
      api.get<Trip>(`/trips/${tripId}`),
      // Assuming API supports filtering expenses by tripId
      // TODO: Confirm API endpoint/parameter for filtering expenses by trip
      api.get<Expense[]>(`/expenses?tripId=${tripId}`)
    ]);

    if (!trip) {
        throw svelteKitError(404, 'Trip not found');
    }

    return {
      trip,
      expenses,
      loading: false
    };
  } catch (error) {
    console.error(`Failed to load trip ${tripId} details:`, error);
    if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
        if (status === 403) {
            throw svelteKitError(403, 'Forbidden: You do not have permission to view this trip.');
        }
         if (status === 404) {
            throw svelteKitError(404, 'Trip not found');
        }
    }
    throw svelteKitError(500, 'Failed to load trip data.');
  }
};

export const ssr = false; // Disable SSR for now