import type { User } from 'firebase/auth';

export interface AuthState {
  user: User | null | undefined; // Allow undefined for initial loading state
  loading: boolean;
  error: string | null;
}

export interface UserProfile extends Omit<User, 'toJSON'> {
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
}

export type AuthStoreSubscriber = (state: AuthState) => void;

export interface AuthStore {
  subscribe: (callback: AuthStoreSubscriber) => () => void;
  set: (value: AuthState) => void;
  update: (updater: (state: AuthState) => AuthState) => void;
}