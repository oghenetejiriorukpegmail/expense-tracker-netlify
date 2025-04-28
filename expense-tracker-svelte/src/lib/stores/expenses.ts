import { writable, derived } from 'svelte/store';
import type { Expense, ExpenseFilter, CreateExpense, UpdateExpense } from '$lib/types/expense';
import { trpc } from '$lib/trpc/client';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  filter: ExpenseFilter;
  totalCount: number;
}

// Helper function to transform API response dates to Date objects
function transformExpense(expense: any): Expense {
  return {
    ...expense,
    date: new Date(expense.date),
    createdAt: expense.createdAt ? new Date(expense.createdAt) : undefined,
    updatedAt: expense.updatedAt ? new Date(expense.updatedAt) : undefined
  };
}

function createExpenseStore() {
  const { user } = get(authStore);
  
  const initialState: ExpenseState = {
    expenses: [],
    isLoading: false,
    error: null,
    filter: {
      userId: user?.uid ?? '',
      page: 1,
      limit: 10,
      sortBy: 'date',
      sortOrder: 'desc'
    },
    totalCount: 0
  };

  const { subscribe, set, update } = writable<ExpenseState>(initialState);

  const store = {
    subscribe,
    
    // Reset store to initial state
    reset: () => set(initialState),

    // Set loading state
    setLoading: (loading: boolean) => 
      update(state => ({ ...state, isLoading: loading, error: null })),

    // Set error state
    setError: (error: string) => 
      update(state => ({ ...state, error, isLoading: false })),

    // Update filter and fetch expenses
    async setFilter(filter: Partial<ExpenseFilter>) {
      const { user } = get(authStore);
      if (!user) return;

      update(state => ({
        ...state,
        filter: { ...state.filter, ...filter, userId: user.uid },
        isLoading: true,
        error: null
      }));

      try {
        const result = await store.fetchExpenses();
        update(state => ({
          ...state,
          expenses: result.expenses.map(transformExpense),
          totalCount: result.totalCount,
          isLoading: false
        }));
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to fetch expenses');
      }
    },

    // Fetch expenses based on current filter
    async fetchExpenses() {
      let state: ExpenseState;
      update(s => {
        state = s;
        return { ...s, isLoading: true, error: null };
      });

      try {
        const result = await trpc.expenses.list.query(state!.filter);
        const transformedExpenses = result.expenses.map(transformExpense);
        update(s => ({
          ...s,
          expenses: transformedExpenses,
          totalCount: result.totalCount,
          isLoading: false
        }));
        return { ...result, expenses: transformedExpenses };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch expenses';
        store.setError(errorMessage);
        throw error;
      }
    },

    // Create new expense
    async createExpense(expense: CreateExpense) {
      store.setLoading(true);
      try {
        const newExpense = await trpc.expenses.create.mutate(expense);
        const transformedExpense = transformExpense(newExpense);
        update(state => ({
          ...state,
          expenses: [transformedExpense, ...state.expenses],
          totalCount: state.totalCount + 1,
          isLoading: false
        }));
        return transformedExpense;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to create expense');
        throw error;
      }
    },

    // Update existing expense
    async updateExpense(expense: UpdateExpense) {
      store.setLoading(true);
      try {
        const updatedExpense = await trpc.expenses.update.mutate(expense);
        const transformedExpense = transformExpense(updatedExpense);
        update(state => ({
          ...state,
          expenses: state.expenses.map(e => 
            e.id === transformedExpense.id ? transformedExpense : e
          ),
          isLoading: false
        }));
        return transformedExpense;
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to update expense');
        throw error;
      }
    },

    // Delete expense
    async deleteExpense(id: string) {
      store.setLoading(true);
      try {
        await trpc.expenses.delete.mutate({ id });
        update(state => ({
          ...state,
          expenses: state.expenses.filter(e => e.id !== id),
          totalCount: state.totalCount - 1,
          isLoading: false
        }));
      } catch (error) {
        store.setError(error instanceof Error ? error.message : 'Failed to delete expense');
        throw error;
      }
    }
  };

  return store;
}

// Create and export the expense store instance
export const expenseStore = createExpenseStore();

// Derived stores for convenient access to specific state
export const expenses = derived(expenseStore, $store => $store.expenses);
export const isLoading = derived(expenseStore, $store => $store.isLoading);
export const error = derived(expenseStore, $store => $store.error);
export const filter = derived(expenseStore, $store => $store.filter);
export const totalCount = derived(expenseStore, $store => $store.totalCount);