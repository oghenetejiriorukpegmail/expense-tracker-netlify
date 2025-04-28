import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load: PageLoad = async () => {
  // Wait for the auth store to finish its initial check
  await authStore.authInitialized;

  const { user, loading } = get(authStore);

  // Avoid redirect loops during initial load
  if (loading) {
    return {}; // Let the layout handle the loading state
  }

  if (user) {
    throw redirect(307, '/dashboard');
  } else {
    throw redirect(307, '/auth/login');
  }
};