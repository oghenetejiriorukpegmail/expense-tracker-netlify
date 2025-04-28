import { writable, derived } from 'svelte/store';
import { auth } from '$lib/firebase'; // Import the initialized auth instance
// Removed problematic import: import type { User as FirebaseUser } from 'firebase/auth';

// Define an interface based on known properties of the Firebase User object
interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  // Add other properties you expect to use
}

interface AuthState {
  user: AuthUser | null; // Use our defined interface
  loading: boolean;
  error: Error | null;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true, // Start in loading state until listener resolves
    error: null,
  });

  return {
    subscribe,
    // Use 'any' for the input user object from Firebase listener, then map to our AuthUser type
    setUser: (firebaseUser: any | null) => update(state => ({
        ...state,
        user: firebaseUser ? { // Map properties safely
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            // Add other mappings if needed
        } : null,
        error: null // Clear error on user change
    })),
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    setError: (error: Error | null) => update(state => ({ ...state, error, loading: false })), // Stop loading on error
    clearError: () => update(state => ({ ...state, error: null })),
    signOut: () => set({ user: null, loading: false, error: null }), // Reset state on sign out
  };
}

export const authStore = createAuthStore();

export const isAuthenticated = derived(authStore, $store => !!$store.user);
export const isLoading = derived(authStore, $store => $store.loading);
export const currentUser = derived(authStore, $store => $store.user); // Provides our AuthUser type