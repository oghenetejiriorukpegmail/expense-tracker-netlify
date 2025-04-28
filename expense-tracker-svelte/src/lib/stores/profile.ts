import { writable, type Writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { authStore } from './auth';

export interface UserProfile {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  themePreference: 'light' | 'dark';
  notificationPreferences: {
    email: boolean;
    push: boolean;
  };
}

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

function createProfileStore() {
  const store: Writable<ProfileState> = writable({
    profile: null,
    loading: false,
    error: null
  });

  const { subscribe, set, update } = store;

  return {
    subscribe,
    
    async updateProfile(data: Partial<UserProfile>) {
      try {
        update((state: ProfileState) => ({ ...state, loading: true, error: null }));
        
        // Get current user from auth store
        const unsubscribe = authStore.subscribe(({ user }) => {
          if (!user) throw new Error('No authenticated user');
        });
        unsubscribe();

        // Update profile in Firebase
        // TODO: Implement Firebase profile update

        update((state: ProfileState) => ({
          ...state,
          profile: state.profile ? { ...state.profile, ...data } : null,
          loading: false
        }));
      } catch (error) {
        update((state: ProfileState) => ({
          ...state,
          error: (error as Error).message,
          loading: false
        }));
        throw error;
      }
    },

    async loadProfile(user: User) {
      try {
        update((state: ProfileState) => ({ ...state, loading: true, error: null }));

        // Initialize basic profile from Firebase user
        const profile: UserProfile = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          themePreference: 'light',
          notificationPreferences: {
            email: true,
            push: true
          }
        };

        // TODO: Load additional profile data from backend

        set({ profile, loading: false, error: null });
      } catch (error) {
        set({
          profile: null,
          loading: false,
          error: (error as Error).message
        });
        throw error;
      }
    },

    reset() {
      set({ profile: null, loading: false, error: null });
    }
  };
}

export const profileStore = createProfileStore();

// Subscribe to auth changes to load profile
authStore.subscribe(({ user }) => {
  if (user) {
    profileStore.loadProfile(user);
  } else {
    profileStore.reset();
  }
});