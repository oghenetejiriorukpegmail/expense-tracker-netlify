import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type { AuthState } from '$lib/types/auth';

export const load: PageLoad = async () => {
  const state = get(authStore) as AuthState;

  // Wait for auth state to be determined
  if (state.loading) {
    return { loading: true };
  }

  // Redirect to login if not authenticated
  if (!state.user) {
    throw redirect(302, '/auth/login');
  }

  return {
    user: {
      email: state.user.email,
      displayName: state.user.displayName,
      photoURL: state.user.photoURL,
      emailVerified: state.user.emailVerified
    }
  };
};