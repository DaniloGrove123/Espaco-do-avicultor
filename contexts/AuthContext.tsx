
import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, AuthContextType, AuthState } from '../types';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = { id: '1', username: 'admin' };
const MOCK_PASSWORD = 'admin123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedUser, setStoredUser] = useLocalStorage<User | null>(LOCAL_STORAGE_KEYS.AUTH_USER, null);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: !!storedUser,
    user: storedUser,
  });

  const login = useCallback(async (username: string, password_mock: string): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === MOCK_USER.username && password_mock === MOCK_PASSWORD) {
          setStoredUser(MOCK_USER);
          setAuthState({ isAuthenticated: true, user: MOCK_USER });
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }, [setStoredUser]);

  const logout = useCallback(() => {
    setStoredUser(null);
    setAuthState({ isAuthenticated: false, user: null });
  }, [setStoredUser]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};