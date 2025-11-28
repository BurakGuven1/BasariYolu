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

  // Initialize auth state with Supabase session
  useEffect(() => {
    if (initialized) return;

    const initializeAuth = async () => {
      try {
        // Get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session?.user) {
          // Check localStorage for additional user type info
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          let userType: UserType = 'student';
          let additionalData: any = {};

          if (stored) {
            try {
              const parsedStored = JSON.parse(stored);
              userType = parsedStored.userType || 'student';
              additionalData = {
                isParentLogin: parsedStored.isParentLogin,
                connectedStudents: parsedStored.connectedStudents,
                teacherData: parsedStored.teacherData,
                institutionSession: parsedStored.institutionSession,
              };
            } catch (e) {
              console.warn('⚠️ Failed to parse stored session');
            }
          } else {
            // Fallback to user metadata
            userType = session.user.user_metadata?.user_type || 'student';
          }

          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            userType,
            profile: session.user.user_metadata,
            metadata: session.user.user_metadata,
            ...additionalData,
          };

          setUser(authUser);
          saveSession(authUser);
        } else {
          // Check localStorage for non-Supabase users (teacher/institution)
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            try {
              const parsedStored = JSON.parse(stored);
              if (parsedStored.userType === 'teacher' || parsedStored.userType === 'institution') {
                setUser(parsedStored);
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse stored non-Supabase session');
            }
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized, saveSession]);

  // Listen to Supabase auth changes - THIS HANDLES TOKEN REFRESH AUTOMATICALLY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {


      if (event === 'SIGNED_IN' && session?.user) {
        // Check localStorage for additional info
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        let userType: UserType = 'student';
        let additionalData: any = {};

        if (stored) {
          try {
            const parsedStored = JSON.parse(stored);
            userType = parsedStored.userType || session.user.user_metadata?.user_type || 'student';
            additionalData = {
              isParentLogin: parsedStored.isParentLogin,
              connectedStudents: parsedStored.connectedStudents,
              teacherData: parsedStored.teacherData,
              institutionSession: parsedStored.institutionSession,
            };
          } catch (e) {
            userType = session.user.user_metadata?.user_type || 'student';
          }
        } else {
          userType = session.user.user_metadata?.user_type || 'student';
        }

        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || '',
          userType,
          profile: session.user.user_metadata,
          metadata: session.user.user_metadata,
          ...additionalData,
        };

        setUser(authUser);
        saveSession(authUser);
      } else if (event === 'SIGNED_OUT') {
        // Only clear if it's a Supabase student/parent logout
        const currentStored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (currentStored) {
          try {
            const parsed = JSON.parse(currentStored);
            // Only clear for student/parent - keep teacher/institution
            if (parsed.userType === 'student' || parsed.userType === 'parent') {
              setUser(null);
              saveSession(null);
            }
          } catch (e) {
            setUser(null);
            saveSession(null);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refresh successful - Supabase handles this automatically
        // We don't need to do anything!
      } else if (event === 'USER_UPDATED') {
        // User metadata updated
        if (session?.user && user) {
          const updatedUser: AuthUser = {
            ...user,
            email: session.user.email || user.email,
            profile: session.user.user_metadata,
            metadata: session.user.user_metadata,
          };
          setUser(updatedUser);
          saveSession(updatedUser);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user, saveSession]);

  // Login function
  const login = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    saveSession(authUser);
  }, [saveSession]);

  // Logout function - CRITICAL FIX: Stable logout for all user types
  const logout = useCallback(async (options?: LogoutOptions) => {
    console.log('🚪 Logout initiated for user:', user?.userType);

    try {
      // 1. Sign out from Supabase (only for student/parent)
      if (user?.userType === 'student' || user?.userType === 'parent') {
        console.log('🔓 Signing out from Supabase...');
        await supabase.auth.signOut({ scope: 'local' });
      }

      // 2. Clear all user state
      console.log('🧹 Clearing user state...');
      setUser(null);
      saveSession(null);

      // 3. Clear ALL auth-related storage (comprehensive cleanup)
      localStorage.removeItem('institutionSession');
      localStorage.removeItem('classViewerSession');
      localStorage.removeItem('teacherSession');
      localStorage.removeItem('parentSession');

      // Clear any Supabase auth tokens
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });

      console.log('✅ Logout successful, redirecting...');

      // 4. Force redirect using multiple methods for reliability
      const redirectPath = options?.redirectTo ?? '/';

      // Method 1: Direct window location (most reliable)
      window.location.replace(redirectPath);

      // Fallback: If replace doesn't work in 100ms
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);

    } catch (error) {
      console.error('❌ Logout error:', error);

      // FORCE LOGOUT: Clear everything and redirect even on error
      setUser(null);
      saveSession(null);

      // Nuclear option: clear ALL localStorage
      localStorage.clear();

      // Force redirect
      const redirectPath = options?.redirectTo ?? '/';
      window.location.replace(redirectPath);

      setTimeout(() => {
        window.location.href = redirectPath;
      }, 100);
    }
  }, [user, saveSession]);

  // Manual refresh session (RARELY NEEDED - Supabase auto-refreshes tokens)
  const refreshSession = useCallback(async () => {
    try {

      // For Supabase users (student/parent)
      if (user?.userType === 'student' || user?.userType === 'parent') {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('⚠️ Session refresh error:', error);
          return; // Keep current user - don't logout
        }

        if (session?.user) {
          const updatedUser: AuthUser = {
            ...user,
            id: session.user.id,
            email: session.user.email || user.email,
            profile: session.user.user_metadata,
            metadata: session.user.user_metadata,
          };
          setUser(updatedUser);
          saveSession(updatedUser);
        }
      }
      // For institution users
      else if (user?.userType === 'institution') {
        try {
          const institutionSession = await refreshInstitutionSession();
          if (institutionSession) {
            const updatedUser: AuthUser = {
              ...user,
              institutionSession,
            };
            setUser(updatedUser);
            saveSession(updatedUser);
          }
        } catch (error) {
          console.warn('⚠️ Institution session refresh failed:', error);
          // Keep current user
        }
      }
    } catch (error) {

      // Keep current user - don't logout on errors
    }
  }, [user, saveSession]);

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
