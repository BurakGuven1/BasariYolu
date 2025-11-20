import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParentSession } from './ParentSessionContext';

interface User {
  id: string;
  email?: string | null;
  profile: any;
  isParentLogin?: boolean;
  connectedStudents?: any[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  clearUser: () => Promise<void>;
  setParentUser: (parentData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const lastAuthState = useRef<string>('');
  const { parentUser, setParentUser: setParentSessionUser } = useParentSession();

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const checkParentUser = () => {
      if (parentUser) {
        setUser(parentUser);
        setLoading(false);
        return true;
      }
      return false;
    };

    if (checkParentUser()) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          profile: session.user.user_metadata,
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newState = session?.user?.id || 'signed_out';

      if (lastAuthState.current === newState) return;
      lastAuthState.current = newState;

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          profile: session.user.user_metadata,
        });
      } else if (!parentUser) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, [parentUser]);

  const clearUser = async () => {
    if (user?.isParentLogin) {
      setParentSessionUser(null);
      setUser(null);
      // Navigation will be handled by the component using this context
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    // Navigation will be handled by the component using this context
  };

  const setParentUserHandler = (parentData: any) => {
    const parentUserData = {
      id: parentData.id || `parent_${Date.now()}`,
      email: parentData.email || '',
      profile: {
        full_name: parentData.full_name || 'Veli',
        user_type: 'parent',
      },
      isParentLogin: true,
      connectedStudents: parentData.connectedStudents || [],
    };

    setUser(parentUserData);
    setParentSessionUser(parentUserData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        clearUser,
        setParentUser: setParentUserHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
