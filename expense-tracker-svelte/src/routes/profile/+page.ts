import { redirect } from '@sveltejs/kit';
import type { Load } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { getIdToken } from 'firebase/auth';

export const load: Load = async ({ fetch, depends }) => {
  depends('profile:data');
  
  const authState = get(authStore);
  
  if (!authState.user) {
    throw redirect(302, '/auth');
  }
  
  try {
    // Get the Firebase token
    const token = await getIdToken(authState.user);
    
    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile data');
    }
    
    const profile = await response.json();
    
    return {
      profile
    };
  } catch (error) {
    console.error('Error loading profile:', error);
    return {
      profile: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};