
import { useContext } from 'react'
import { createContext } from 'react'
import { AuthProvider } from './AuthProvider'
import { AuthContextType } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider }
