import { redirect } from '@sveltejs/kit';
import type { Load } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { getIdToken } from 'firebase/auth';

export const load: Load = async ({ fetch, depends }) => {
  depends('mileage:logs');
  
  const authState = get(authStore);
  
  if (!authState.user) {
    throw redirect(302, '/auth');
  }
  
  try {
    // Get the Firebase token
    const token = await getIdToken(authState.user);
    
    const response = await fetch('/api/mileage-logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch mileage logs');
    }
    
    const logs = await response.json();
    
    return {
      logs
    };
  } catch (error) {
    console.error('Error loading mileage logs:', error);
    return {
      logs: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};