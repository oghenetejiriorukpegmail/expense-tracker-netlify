import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if the environment variables are set
if (!supabaseUrl) {
  console.error("Error: VITE_SUPABASE_URL environment variable is not set.");
  throw new Error("Supabase URL is not configured. Please check your .env file.");
}
if (!supabaseAnonKey) {
  console.error("Error: VITE_SUPABASE_ANON_KEY environment variable is not set.");
  throw new Error("Supabase Anon Key is not configured. Please check your .env file.");
}

// Create and export the Supabase client instance with auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Export auth-related functions for easier access
export const auth = supabase.auth

console.log("Supabase client initialized for client-side with auth configuration.");