import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
  type UserCredential
} from 'firebase/auth';
import { auth } from '$lib/firebase';
import { authStore } from '$lib/stores/auth';

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string, displayName?: string): Promise<UserCredential> {
  try {
    authStore.setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile if display name is provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    authStore.setUser(userCredential.user);
    return userCredential;
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    authStore.setLoading(true);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    authStore.setUser(userCredential.user);
    return userCredential;
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    authStore.setLoading(true);
    await firebaseSignOut(auth);
    authStore.signOut();
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    authStore.setLoading(true);
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<void> {
  try {
    authStore.setLoading(true);
    await updateProfile(user, profile);
    authStore.setUser(auth.currentUser);
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Update the current user's email
 */
export async function updateUserEmail(user: User, newEmail: string): Promise<void> {
  try {
    authStore.setLoading(true);
    await updateEmail(user, newEmail);
    authStore.setUser(auth.currentUser);
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Update the current user's password
 */
export async function updateUserPassword(user: User, newPassword: string): Promise<void> {
  try {
    authStore.setLoading(true);
    await updatePassword(user, newPassword);
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Reauthenticate the current user
 */
export async function reauthenticate(user: User, password: string): Promise<UserCredential> {
  try {
    authStore.setLoading(true);
    const credential = EmailAuthProvider.credential(user.email as string, password);
    return await reauthenticateWithCredential(user, credential);
  } catch (error) {
    authStore.setError(error as Error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Initialize the auth service by setting up auth state listener
 */
export function initAuth(): () => void {
  const unsubscribe = auth.onAuthStateChanged(
    (user) => {
      authStore.setUser(user);
      authStore.setLoading(false);
    },
    (error) => {
      authStore.setError(error);
      authStore.setLoading(false);
    }
  );
  
  return unsubscribe;
}