import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MalariaSession, MalariaUser } from "@/integrations/supabase/client";

type AppRole = "admin" | "sk";

interface Profile {
  full_name: string;
  email: string;
  micro_role?: string | null;
}

interface AuthContextType {
  user: MalariaUser | null;
  profile: Profile | null;
  role: AppRole | null;
  microRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MalariaUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [microRole, setMicroRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearUserData = () => {
    setUser(null);
    setProfile(null);
    setRole(null);
    setMicroRole(null);
  };

  useEffect(() => {
    let mounted = true;

    const syncSession = async (session: MalariaSession | null) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        setProfile(session.profile ?? null);
        setRole((session.role as AppRole | null) ?? null);
        setMicroRole(session.profile?.micro_role ?? null);
      } else {
        clearUserData();
      }
    };

    const initializeAuth = async () => {
      if (!mounted) return;
      setLoading(true);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        await syncSession(session);
      } catch (err) {
        console.error("auth initialization error:", err);
        if (!mounted) return;
        clearUserData();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setLoading(true);

      // Avoid async work directly inside the auth callback.
      void (async () => {
        try {
          await syncSession(session);
        } catch (err) {
          console.error("auth state sync error:", err);
          if (!mounted) return;
          clearUserData();
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    });

    void initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, microRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
