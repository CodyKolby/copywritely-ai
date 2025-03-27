
import { createClient } from '@supabase/supabase-js'

// Get environment variables or use default empty strings to prevent crashes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jorbqjareswzdrsmepbv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcmJxamFyZXN3emRyc21lcGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTcyNjMsImV4cCI6MjA1ODEzMzI2M30.WtGgnQKLVD2ZuOq4qNrIfcmFc98U3Q6YLrCCRG_mrH4'

// Rejestrujemy wartości na konsolę, aby ułatwić debugowanie
console.log("Supabase URL:", supabaseUrl);
// Nie logujemy pełnego klucza ze względów bezpieczeństwa
console.log("Supabase key available:", supabaseAnonKey ? "Yes" : "No");

// Only log the error if actually trying to use the app (not during build)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
