import { api } from '$lib/api/client';
import type { PublicUser } from '../../../shared/schema'; // Adjust path
import type { PageLoadEvent } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/firebase';
import { browser } from '$app/environment';
import { error as svelteKitError } from '@sveltejs/kit';

export const load = async ({ fetch }: PageLoadEvent) => {
  if (!browser) {
    return { userProfile: null, loading: true };
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw redirect(307, '/auth');
  }

  try {
    const userProfile = await api.get<PublicUser>('/profile');
    if (!userProfile) {
        // This case might indicate an issue syncing auth user with DB user
        console.error("User is authenticated but profile data not found.");
        throw svelteKitError(404, 'User profile not found. Please contact support.');
    }
    return {
      userProfile,
      loading: false
    };
  } catch (error) {
    console.error('Failed to load user profile:', error);
    if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401) {
           throw redirect(307, '/auth');
        }
         if (status === 404) {
             throw svelteKitError(404, 'User profile not found. Please contact support.');
        }
    }
    throw svelteKitError(500, 'Failed to load profile data.');
  }
};

export const ssr = false; // Disable SSR for now