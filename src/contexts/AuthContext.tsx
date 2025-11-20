import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { refreshInstitutionSession, InstitutionSession } from '../lib/institutionApi';

export type UserType = 'student' | 'parent' | 'teacher' | 'institution';

export interface AuthUser {
  id: string;
  email: string;
  userType: UserType;
  profile?: any;
  metadata?: any;
  // For parent login
  isParentLogin?: boolean;
  connectedStudents?: any[];
  // For teacher
  teacherData?: any;
  // For institution
  institutionSession?: InstitutionSession;
}

interface LogoutOptions {
  redirectTo?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: (options?: LogoutOptions) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'basariyolu_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Save session to localStorage
  const saveSession = useCallback((authUser: AuthUser | null) => {
    if (authUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  // Load session from localStorage
  const loadSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;

      const session: AuthUser = JSON.parse(stored);

      // Validate session based on user type
      switch (session.userType) {
        case 'institution':
          // Refresh institution session
          try {
            const institutionSession = await refreshInstitutionSession();
            if (institutionSession) {
              return {
                ...session,
                institutionSession,
              };
            }
            return null;
          } catch {
            return null;
          }

        case 'teacher':
          // Validate teacher session
          // Teacher data is already in session, just verify it's still valid
          if (session.teacherData) {
            return session;
          }
          return null;

        case 'student':
        case 'parent':
          // Validate Supabase session
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
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
        // Try to load from localStorage first
        const storedSession = await loadSession();
        if (storedSession) {
          setUser(storedSession);
          setLoading(false);
          setInitialized(true);
          return;
        }

        // If no stored session, check Supabase auth for student/parent
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            userType: session.user.user_metadata?.user_type || 'student',
            profile: session.user.user_metadata,
          };
          setUser(authUser);
          saveSession(authUser);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Only update if it's a student/parent login (not teacher/institution)
        if (user?.userType === 'teacher' || user?.userType === 'institution') {
          return;
        }

        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          userType: session.user.user_metadata?.user_type || 'student',
          profile: session.user.user_metadata,
        };
        setUser(authUser);
        saveSession(authUser);
      } else if (event === 'SIGNED_OUT') {
        // Only clear if it's not a teacher/institution session
        if (user?.userType === 'student' || user?.userType === 'parent') {
          setUser(null);
          saveSession(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.userType, saveSession]);

  // Login function
  const login = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    saveSession(authUser);
  }, [saveSession]);

  // Logout function
  const logout = useCallback(async (options?: LogoutOptions) => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      saveSession(null);

      // Clear legacy storage keys
      localStorage.removeItem('institutionSession');
      localStorage.removeItem('classViewerSession');
      // Redirect to home or custom path
      window.location.href = options?.redirectTo ?? '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear and redirect even if error
      setUser(null);
      saveSession(null);
      window.location.href = options?.redirectTo ?? '/';
    }
  }, [saveSession]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const session = await loadSession();
    if (session) {
      setUser(session);
      saveSession(session);
    } else {
      setUser(null);
      saveSession(null);
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
