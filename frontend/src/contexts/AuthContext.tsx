import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../services/api/authApi';
import { useIdleSession } from '../hooks/useIdleSession';
import SessionTimeoutModal from '../components/SessionTimeoutModal/SessionTimeoutModal';
import { isAdminArea } from '../utils/adminSession';

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
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(0);

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

  const isAuthenticated = !!user && !!localStorage.getItem('accessToken');
  // Admin idle is owned by DashboardLayout — avoid double timers on /admin.
  const memberIdleEnabled = isAuthenticated && !isAdminArea();

  const endMemberSession = useCallback(() => {
    setIdleWarning(false);
    void logout().then(() => {
      window.location.href = '/session-expired';
    });
  }, [logout]);

  const { stayLoggedIn } = useIdleSession(memberIdleEnabled, {
    onWarn: (secondsLeft) => {
      setIdleSecondsLeft(secondsLeft);
      setIdleWarning(true);
    },
    onWarnTick: setIdleSecondsLeft,
    onIdle: endMemberSession,
  });

  const handleStayLoggedIn = () => {
    stayLoggedIn();
    setIdleWarning(false);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated, login, logout, updateUser }),
    [user, isAuthenticated, login, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutModal
        show={idleWarning && memberIdleEnabled}
        secondsLeft={idleSecondsLeft}
        onStay={handleStayLoggedIn}
        onSignOut={endMemberSession}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
