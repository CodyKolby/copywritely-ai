
import { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { useAuthProvider } from './useAuthProvider';

export function AuthProvider({ children }: { children: ReactNode }) {
  const authState = useAuthProvider();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}
