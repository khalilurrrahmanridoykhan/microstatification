import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getAuthToken,
  getSession,
  login,
  logout,
  setAuthToken,
  type AppRole,
  type AuthProfile,
  type SessionData,
  type SessionUser,
} from "@/lib/api";

interface AuthContextType {
  user: SessionUser | null;
  profile: AuthProfile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session: SessionData) => {
    setUser(session.user);
    setProfile(session.profile);
    setRole(session.role);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setProfile(null);
    setRole(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!getAuthToken()) {
      clearSession();
      setLoading(false);
      return;
    }

    try {
      const session = await getSession();
      applySession(session);
    } catch (_error) {
      setAuthToken(null);
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await login(email, password);
      setAuthToken(session.token);
      applySession(session);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch (_error) {
      // Local auth is stateless; clearing the client token is sufficient.
    }

    setAuthToken(null);
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{ user, profile, role, loading, signIn, signOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
