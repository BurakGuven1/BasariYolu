import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthUser = {
  id: string;
  email: string | null;
  userType: 'student' | 'parent' | 'teacher' | 'institution';
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, userType: AuthUser['userType']) => Promise<void>;
  signUp: (email: string, password: string, userType: AuthUser['userType']) => Promise<void>;
  signOut: () => Promise<void>;
  setUserManually: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const metaRole =
          (data.session.user.user_metadata as any)?.userType ?? 'student';
        setUser({
          id: data.session.user.id,
          email: data.session.user.email,
          userType: metaRole,
        });
      }
      setLoading(false);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metaRole = (session.user.user_metadata as any)?.userType ?? 'student';
        setUser({ id: session.user.id, email: session.user.email, userType: metaRole });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, userType: AuthUser['userType']) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      // Ensure metadata has userType for future sessions
      await supabase.auth.updateUser({ data: { userType } });
    }
    if (data.session?.user) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email,
        userType: userType,
      });
    }
  };

  const signUp = async (email: string, password: string, userType: AuthUser['userType']) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.auth.updateUser({ data: { userType } });
    }
    if (data.session?.user) {
      setUser({
        id: data.session.user.id,
        email: data.session.user.email,
        userType: userType,
      });
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setUserManually: setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
