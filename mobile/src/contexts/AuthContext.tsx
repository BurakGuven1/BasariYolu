import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  AuthUser,
  AuthContextType,
  LogoutOptions,
  UserType,
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@basariyolu_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Save session to AsyncStorage
  const saveSession = useCallback(async (authUser: AuthUser | null) => {
    try {
      if (authUser) {
        await AsyncStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(authUser)
        );
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, []);

  // Load session from AsyncStorage
  const loadSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;

      const session: AuthUser = JSON.parse(stored);

      // Validate session based on user type
      switch (session.userType) {
        case 'institution':
          // For institution, check if session is still valid
          if (
            session.institutionSession &&
            session.institutionSession.expiresAt > Date.now()
          ) {
            return session;
          }
          return null;

        case 'teacher':
          // Teacher data is already in session
          if (session.teacherData) {
            return session;
          }
          return null;

        case 'student':
        case 'parent':
          // Validate Supabase session
          const {
            data: { session: supabaseSession },
          } = await supabase.auth.getSession();
          if (supabaseSession?.user) {
            return {
              ...session,
              id: supabaseSession.user.id,
              email: supabaseSession.user.email || session.email,
            };
          }
          return null;

        default:
          return null;
      }
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (initialized) return;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        // Try to load from AsyncStorage first
        const storedSession = await loadSession();
        if (storedSession) {
          setUser(storedSession);
          setLoading(false);
          setInitialized(true);
          return;
        }

        // If no stored session, check Supabase auth for student/parent
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            userType:
              (session.user.user_metadata?.user_type as UserType) || 'student',
            profile: session.user.user_metadata,
          };
          setUser(authUser);
          await saveSession(authUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized, loadSession, saveSession]);

  // Listen to Supabase auth changes (for student/parent)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Only update if it's a student/parent login (not teacher/institution)
        if (user?.userType === 'teacher' || user?.userType === 'institution') {
          return;
        }

        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          userType:
            (session.user.user_metadata?.user_type as UserType) || 'student',
          profile: session.user.user_metadata,
        };
        setUser(authUser);
        await saveSession(authUser);
      } else if (event === 'SIGNED_OUT') {
        // Only clear if it's not a teacher/institution session
        if (user?.userType === 'student' || user?.userType === 'parent') {
          setUser(null);
          await saveSession(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.userType, saveSession]);

  // Login function
  const login = useCallback(
    async (authUser: AuthUser) => {
      setUser(authUser);
      await saveSession(authUser);
    },
    [saveSession]
  );

  // Logout function
  const logout = useCallback(
    async (options?: LogoutOptions) => {
      try {
        await supabase.auth.signOut();
        setUser(null);
        await saveSession(null);

        // Clear legacy storage keys
        await AsyncStorage.removeItem('@institutionSession');
        await AsyncStorage.removeItem('@classViewerSession');
      } catch (error) {
        console.error('Logout error:', error);
        // Force clear even if error
        setUser(null);
        await saveSession(null);
      }
    },
    [saveSession]
  );

  // Refresh session
  const refreshSession = useCallback(async () => {
    const session = await loadSession();
    if (session) {
      setUser(session);
      await saveSession(session);
    } else {
      setUser(null);
      await saveSession(null);
    }
  }, [loadSession, saveSession]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
