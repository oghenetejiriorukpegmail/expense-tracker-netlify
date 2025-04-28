import { trpc } from '$lib/trpc';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { writable, type Writable } from 'svelte/store';

// Create stores for loading and error states
export const isLoading: Writable<boolean> = writable(false);
export const error: Writable<Error | null> = writable(null);

// Helper function to handle API calls with loading and error states
export async function apiCall<T>(
  callback: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (err: Error) => void;
  } = {}
): Promise<T | null> {
  isLoading.set(true);
  error.set(null);

  try {
    const result = await callback();
    options.onSuccess?.(result);
    return result;
  } catch (err) {
    const apiError = err instanceof Error ? err : new Error('An unknown error occurred');
    error.set(apiError);
    options.onError?.(apiError);
    return null;
  } finally {
    isLoading.set(false);
  }
}

// Hook to handle expenses
export const useExpenses = () => {
  const createExpense = async (data: {
    amount: number;
    description: string;
    date: string;
    category: string;
    receiptUrl?: string;
  }) => {
    return apiCall(() => trpc.expense.create.mutate(data));
  };

  const getExpenses = async (params?: {
    limit?: number;
    cursor?: string;
  }) => {
    return apiCall(() => trpc.expense.list.query(params || {}));
  };

  const getExpenseById = async (id: string) => {
    return apiCall(() => trpc.expense.byId.query({ id }));
  };

  const updateExpense = async (id: string, data: {
    amount?: number;
    description?: string;
    date?: string;
    category?: string;
    receiptUrl?: string;
  }) => {
    return apiCall(() => trpc.expense.update.mutate({ id, data }));
  };

  const deleteExpense = async (id: string) => {
    return apiCall(() => trpc.expense.delete.mutate({ id }));
  };

  return {
    createExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    isLoading,
    error,
  };
};

// Initialize auth state listener
if (typeof window !== 'undefined' && auth) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Clear any cached data or reset state when user logs out
      error.set(null);
      isLoading.set(false);
    }
  });
}