import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient"; // Import Supabase client
import { AuthError, Session, User as SupabaseAuthUser, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/lib/store";
import { queryClient } from "../lib/queryClient"; // Import queryClient for potential cache invalidation

// Define the shape of the user object we'll expose (Supabase Auth User)
type User = SupabaseAuthUser;

// Define the context type
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean; // Indicates if initial session loading is happening
  error: AuthError | null; // Store Supabase auth errors
  loginMutation: UseMutationResult<void, AuthError, SignInWithPasswordCredentials>;
  logoutMutation: UseMutationResult<void, AuthError, void>;
  registerMutation: UseMutationResult<void, AuthError, SignUpWithPasswordCredentials>;
};

// Create the context
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const setTheme = useSettingsStore((state) => state.setTheme);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // Initialize theme from localStorage on mount (remains the same)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, [setTheme]);

  // Effect to check initial session and subscribe to auth state changes
  useEffect(() => {
    setIsLoading(true);
    setAuthError(null);

    // Check current session on initial load
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting initial session:", error);
        setAuthError(error);
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false); // Finished initial load

      // Set up the auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          console.log("Auth state changed:", _event, newSession);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setAuthError(null); // Clear previous errors on state change
          setIsLoading(false); // Ensure loading is false after state change
        }
      );

      // Cleanup subscription on unmount
      return () => {
        subscription?.unsubscribe();
      };
    }).catch(err => {
        console.error("Catch Error getting initial session:", err);
        setAuthError(err instanceof AuthError ? err : new AuthError(err.message || "Unknown error during session check"));
        setIsLoading(false);
    });

  }, []); // Run only once on mount

  // --- Mutations using Supabase client ---

  const loginMutation = useMutation<void, AuthError, SignInWithPasswordCredentials>({
    mutationFn: async (credentials) => {
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      // Session/user state is updated by the onAuthStateChange listener
    },
    onSuccess: () => {
      // User state is set by the listener, just show toast
      toast({
        title: "Login successful",
        description: `Welcome back!`, // User info available via state shortly
      });
      // Optionally invalidate queries that depend on user auth
      queryClient.invalidateQueries();
    },
    onError: (error: AuthError) => {
      console.error("Login Error:", error);
      setAuthError(error); // Store the error
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<void, AuthError, SignUpWithPasswordCredentials>({
    mutationFn: async (credentials) => {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) throw error;
      // IMPORTANT: If email confirmation is required, the user object might be null initially.
      // The onAuthStateChange listener will update the state when the user logs in after confirming.
      // We also need a mechanism (e.g., Supabase Function trigger or API call)
      // to create the corresponding user record in our public.users table.
      console.log("Supabase signUp result:", data);
    },
    onSuccess: () => {
      // User state set by listener (potentially after email confirmation)
      toast({
        title: "Registration initiated",
        description: "Please check your email for a confirmation link if required.",
      });
    },
    onError: (error: AuthError) => {
      console.error("Registration Error:", error);
      setAuthError(error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, AuthError, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // User state cleared by listener
    },
    onSuccess: () => {
      // User state cleared by listener
      queryClient.clear(); // Clear React Query cache on logout
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
    onError: (error: AuthError) => {
      console.error("Logout Error:", error);
      setAuthError(error);
      toast({
        title: "Logout failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error: authError, // Provide the auth error state
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
