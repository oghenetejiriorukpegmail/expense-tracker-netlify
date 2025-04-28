import { api } from '$lib/api/client';
import type { MileageLog, Trip } from '../../../../../shared/schema'; // Corrected relative path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit';

export const load = async ({ params, fetch }: PageLoadEvent) => {
  if (!browser) {
    return { log: null, availableTrips: [], loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  const logId = parseInt(params.id);
  if (isNaN(logId)) {
     throw svelteKitError(400, 'Invalid mileage log ID');
  }

  try {
    // Fetch log details and available trips concurrently
    const [log, availableTrips] = await Promise.all([
       api.get<MileageLog>(`/mileage-logs/${logId}`),
       api.get<Trip[]>('/trips') // Fetch trips for the dropdown
    ]);

    if (!log) {
        throw svelteKitError(404, 'Mileage log not found');
    }
    return {
      log,
      availableTrips,
      loading: false
    };
  } catch (error) {
    console.error(`Failed to load mileage log ${logId} for editing:`, error);
     if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
        if (status === 403) {
            throw svelteKitError(403, 'Forbidden: You do not have permission to edit this log.');
        }
         if (status === 404) {
            throw svelteKitError(404, 'Mileage log not found');
        }
    }
    throw svelteKitError(500, 'Failed to load mileage log data.');
  }
};

export const ssr = false; // Disable SSR for now