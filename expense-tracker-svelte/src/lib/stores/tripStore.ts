import { writable, derived } from 'svelte/store';
import type { Trip, CreateTrip, TripSummary, TripStatus } from '../types/trip';
import { trpc } from '../trpc';
import type { TRPCClientError } from '@trpc/client';

interface TripState {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  currentTrip: Trip | null;
  filters: {
    status?: TripStatus;
    startDate?: Date;
    endDate?: Date;
  };
}

const initialState: TripState = {
  trips: [],
  loading: false,
  error: null,
  currentTrip: null,
  filters: {}
};

function createTripStore() {
  const { subscribe, set, update } = writable<TripState>(initialState);

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'An error occurred';
    update(state => ({ ...state, error: message, loading: false }));
    throw error;
  };

  return {
    subscribe,
    reset: () => set(initialState),
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    setError: (error: string | null) => update(state => ({ ...state, error })),

    async fetchTrips() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const trips = await trpc.trip.list.query();
        update(state => ({ ...state, trips, loading: false }));
        return trips;
      } catch (error) {
        handleError(error);
      }
    },

    async createTrip(data: CreateTrip) {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const newTrip = await trpc.trip.create.mutate(data);
        update(state => ({
          ...state,
          trips: [...state.trips, newTrip],
          loading: false
        }));
        return newTrip;
      } catch (error) {
        handleError(error);
      }
    },

    async updateTrip(id: number, data: Partial<CreateTrip>) {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const updatedTrip = await trpc.trip.update.mutate({ id, ...data });
        update(state => ({
          ...state,
          trips: state.trips.map(t => t.id === id ? updatedTrip : t),
          currentTrip: state.currentTrip?.id === id ? updatedTrip : state.currentTrip,
          loading: false
        }));
        return updatedTrip;
      } catch (error) {
        handleError(error);
      }
    },

    async deleteTrip(id: number) {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        await trpc.trip.delete.mutate(id);
        update(state => ({
          ...state,
          trips: state.trips.filter(t => t.id !== id),
          currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
          loading: false
        }));
      } catch (error) {
        handleError(error);
      }
    },

    async getTripSummary(id: number) {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const summary = await trpc.trip.getSummary.query(id);
        return summary;
      } catch (error) {
        handleError(error);
      }
    },

    setCurrentTrip: (trip: Trip | null) =>
      update(state => ({ ...state, currentTrip: trip })),

    setFilters: (filters: TripState['filters']) =>
      update(state => ({ ...state, filters })),
  };
}

export const tripStore = createTripStore();

export const filteredTrips = derived(tripStore, ($store) => {
  let filtered = [...$store.trips];
  
  if ($store.filters.status) {
    filtered = filtered.filter(trip => trip.status === $store.filters.status);
  }
  
  if ($store.filters.startDate) {
    filtered = filtered.filter(trip => trip.startDate >= $store.filters.startDate!);
  }
  
  if ($store.filters.endDate) {
    filtered = filtered.filter(trip => trip.endDate <= $store.filters.endDate!);
  }
  
  return filtered;
});

export const activeTrips = derived(tripStore, ($store) =>
  $store.trips.filter(trip => trip.status === 'InProgress')
);

export const upcomingTrips = derived(tripStore, ($store) => {
  const now = new Date();
  return $store.trips.filter(trip =>
    trip.status === 'Planned' && trip.startDate > now
  );
});