
import React, { createContext, useContext } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import type { AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  tempUser: null,
  isLoading: true,
  signOut: async () => {},
  createTempUser: async () => ({ id: '', tier: 'free' }),
  claimTempUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuthState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};
