import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type User,
  type UserCredential,
  type AuthProvider
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

/**
 * Sign in with Google using popup
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    authStore.setLoading(true);
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    
    const result = await signInWithPopup(auth, provider);
    authStore.setUser(result.user);
    return result;
  } catch (error: any) {
    authStore.setError(error as Error);
    console.error('Error signing in with Google:', error);
    
    // Handle specific Google Auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled by the user');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('The sign-in popup was blocked by your browser. Please allow popups for this site.');
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with the same email address but different sign-in credentials.');
    }
    
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Sign in with Google using redirect (alternative to popup)
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  try {
    authStore.setLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  } catch (error) {
    authStore.setError(error as Error);
    console.error('Error redirecting to Google sign-in:', error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Get the result of a redirect sign-in
 */
export async function getGoogleRedirectResult(): Promise<UserCredential | null> {
  try {
    authStore.setLoading(true);
    const result = await getRedirectResult(auth);
    if (result) {
      authStore.setUser(result.user);
    }
    return result;
  } catch (error) {
    authStore.setError(error as Error);
    console.error('Error getting redirect result:', error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Set the persistence type for authentication
 * @param persistenceType - 'local', 'session', or 'none'
 */
export async function setPersistenceType(persistenceType: 'local' | 'session' | 'none'): Promise<void> {
  try {
    authStore.setLoading(true);
    let persistence;
    
    switch (persistenceType) {
      case 'local':
        persistence = browserLocalPersistence;
        break;
      case 'session':
        persistence = browserSessionPersistence;
        break;
      case 'none':
        persistence = inMemoryPersistence;
        break;
      default:
        persistence = browserLocalPersistence;
    }
    
    await setPersistence(auth, persistence);
  } catch (error) {
    authStore.setError(error as Error);
    console.error('Error setting persistence:', error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}

/**
 * Check if a user's email is verified
 */
export function isEmailVerified(user: User | null): boolean {
  return !!user?.emailVerified;
}

/**
 * Send email verification to the current user
 */
export async function sendEmailVerification(user: User): Promise<void> {
  try {
    authStore.setLoading(true);
    await firebaseSendEmailVerification(user);
  } catch (error) {
    authStore.setError(error as Error);
    console.error('Error sending verification email:', error);
    throw error;
  } finally {
    authStore.setLoading(false);
  }
}