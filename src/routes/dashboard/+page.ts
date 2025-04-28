import { api } from '$lib/api/client';
import type { PublicUser, Expense } from '../../../shared/schema'; // Added Expense type
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';

// Use PageLoadEvent type
export const load = async ({ fetch }: PageLoadEvent) => {
  // Ensure this runs only on the client or handle auth differently on server
  if (!browser) {
    return { userProfile: null, expenses: [], loading: true }; // Return empty expenses array
  }

  // Check auth state
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  try {
    // Fetch user profile
    const userProfile = await api.get<PublicUser>('/profile');

    // Fetch expenses
    const expenses = await api.get<Expense[]>('/expenses');

    // TODO: Fetch other dashboard data (trip summaries, etc.)
    // const tripSummaries = await api.get('/trips?summary=true');

    return {
      userProfile,
      expenses, // Return fetched expenses
      // tripSummaries,
      loading: false
    };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    if (error instanceof Error && (error as any).status === 401) {
       throw redirect(307, '/auth');
    }
    return {
      userProfile: null,
      expenses: [], // Return empty expenses array on error
      error: 'Failed to load dashboard data.',
      loading: false
    };
  }
};

// Ensure SSR is disabled or handled appropriately if auth relies on client-side Firebase
export const ssr = false;