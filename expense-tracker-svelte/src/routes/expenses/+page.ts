import { redirect } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load = async () => {
  const { user } = get(authStore);
  
  // Redirect to login if not authenticated
  if (!user) {
    throw redirect(302, '/login');
  }

  return {
    user
  };
};