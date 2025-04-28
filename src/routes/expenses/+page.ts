import { api } from '$lib/api/client';
import type { Expense } from '../../../shared/schema';
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';

export const load = async ({ fetch }: PageLoadEvent) => {
  if (!browser) {
    return { expenses: [], loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  try {
    const expenses = await api.get<Expense[]>('/expenses');
    return {
      expenses,
      loading: false
    };
  } catch (error) {
    console.error('Failed to load expenses:', error);
    if (error instanceof Error && (error as any).status === 401) {
       throw redirect(307, '/auth');
    }
    return {
      expenses: [],
      error: 'Failed to load expenses.',
      loading: false
    };
  }
};

export const ssr = false; // Disable SSR for now due to client-side auth dependency