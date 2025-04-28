import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  type User,
  onAuthStateChanged,
  type Auth
} from 'firebase/auth';
import type { AuthState } from '$lib/types/auth'; // Removed AuthStore import as we define type below

// Helper promise to signal when initial auth state is loaded
let resolveAuthInitialized: () => void;
const authInitialized = new Promise<void>((resolve) => {
  resolveAuthInitialized = resolve;
});
let authInitializedResolved = false; // Flag to ensure we only resolve once

function assertAuth(auth: Auth | undefined): asserts auth is Auth {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }
}

const createAuthStore = () => {
  // Define the store type including the new promise
  type AuthStoreType = {
    subscribe: typeof subscribe;
    set: typeof set;
    update: typeof update;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithGithub: () => Promise<void>;
    destroy: () => void;
    authInitialized: Promise<void>; // Add the promise to the type
  };

  const { subscribe, set, update } = writable<AuthState>({
    user: undefined, // Start with undefined user to distinguish from null (logged out)
    loading: true,
    error: null
  });

  let unsubscribe: (() => void) | undefined;

  // Initialize auth state listener
  if (auth) {
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        set({ user, loading: false, error: null });
        if (!authInitializedResolved) {
          resolveAuthInitialized();
          authInitializedResolved = true;
        }
      },
      (error) => {
        set({ user: null, loading: false, error: error.message });
         if (!authInitializedResolved) {
          resolveAuthInitialized();
          authInitializedResolved = true;
        }
      }
    );
  } else {
    set({ user: null, loading: false, error: 'Firebase Auth is not initialized' });
     if (!authInitializedResolved) {
      resolveAuthInitialized();
      authInitializedResolved = true;
    }
  }

  const methods = {
    async login(email: string, password: string) {
      try {
        assertAuth(auth);
        update(state => ({ ...state, loading: true, error: null }));
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        update(state => ({ ...state, error: (error as Error).message }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    async register(email: string, password: string) {
      try {
        assertAuth(auth);
        update(state => ({ ...state, loading: true, error: null }));
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
      } catch (error) {
        update(state => ({ ...state, error: (error as Error).message }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    async logout() {
      try {
        assertAuth(auth);
        update(state => ({ ...state, loading: true, error: null }));
        await signOut(auth);
      } catch (error) {
        update(state => ({ ...state, error: (error as Error).message }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    async resetPassword(email: string) {
      try {
        assertAuth(auth);
        update(state => ({ ...state, loading: true, error: null }));
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
        update(state => ({ ...state, error: (error as Error).message }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    async loginWithGoogle() {
      try {
        assertAuth(auth);
        update(state => ({ ...state, loading: true, error: null }));
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        update(state => ({ ...state, error: (error as Error).message }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    async loginWithGithub() {
      try {
        assertAuth(auth);
        update(state => ({ ...state, loading: true, error: null }));
        const provider = new GithubAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        update(state => ({ ...state, error: (error as Error).message }));
        throw error;
      } finally {
        update(state => ({ ...state, loading: false }));
      }
    },

    // Cleanup function
    destroy() {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  };

  const store: AuthStoreType = {
    subscribe,
    set,
    update,
    ...methods,
    authInitialized // Export the promise
  };

  return store;
};

export const authStore = createAuthStore();