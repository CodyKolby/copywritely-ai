
/**
 * Utility functions to get Supabase configuration from environment variables
 */

/**
 * Returns the Supabase URL from environment variables
 */
export const getSupabaseURL = (): string => {
  return import.meta.env.VITE_SUPABASE_URL || '';
};

/**
 * Returns the Supabase anonymous key from environment variables
 */
export const getSupabaseAnonKey = (): string => {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};
