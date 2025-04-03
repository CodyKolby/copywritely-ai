
import { createContext, useContext } from 'react'
import { AuthContextType } from './types'

// Create the auth context with undefined as default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the context for use in the provider
export { AuthContext };
