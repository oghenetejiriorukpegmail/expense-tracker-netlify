import { error, redirect } from '@sveltejs/kit';
import { trpc } from '$lib/trpc/client';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load = async ({ params }: { params: { id: string } }) => {
  const { user } = get(authStore);
  
  // Redirect to login if not authenticated
  if (!user) {
    throw redirect(302, '/login');
  }

  try {
    // Pre-fetch the expense data
    const expense = await trpc.expenses.getById.query({ id: params.id });

    if (!expense) {
      throw error(404, {
        message: 'Expense not found'
      });
    }

    return {
      expense
    };
  } catch (e) {
    if (e instanceof Error && e.message.includes('not found')) {
      throw error(404, {
        message: 'Expense not found'
      });
    }
    throw error(500, {
      message: 'Failed to load expense'
    });
  }
};