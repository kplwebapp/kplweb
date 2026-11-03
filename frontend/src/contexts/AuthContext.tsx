import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../services/api/authApi';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const clearLocalSession = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!localStorage.getItem('accessToken')) return null;
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((accessToken: string, refreshToken: string, authUser: AuthUser) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('accessToken')) await authApi.logout();
    } catch {
      /* still clear local session */
    }
    clearLocalSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((authUser: AuthUser) => {
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user && !!localStorage.getItem('accessToken'), login, logout, updateUser }),
    [user, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
