import { api } from '$lib/api/client';
import type { Expense } from '../../../../../shared/schema'; // Corrected relative path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit'; // Import error helper

export const load = async ({ params, fetch }: PageLoadEvent) => {
  if (!browser) {
    // Cannot fetch specific expense on server without auth context easily
    return { expense: null, loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  const expenseId = parseInt(params.id);
  if (isNaN(expenseId)) {
     throw svelteKitError(400, 'Invalid expense ID');
  }

  try {
    const expense = await api.get<Expense>(`/expenses/${expenseId}`);
    if (!expense) {
        throw svelteKitError(404, 'Expense not found');
    }
    return {
      expense,
      loading: false
    };
  } catch (error) {
    console.error(`Failed to load expense ${expenseId}:`, error);
    if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
        if (status === 403) {
            throw svelteKitError(403, 'Forbidden: You do not have permission to view this expense.');
        }
         if (status === 404) {
            throw svelteKitError(404, 'Expense not found');
        }
    }
    // Generic error
    throw svelteKitError(500, 'Failed to load expense data.');
  }
};

export const ssr = false; // Disable SSR for now