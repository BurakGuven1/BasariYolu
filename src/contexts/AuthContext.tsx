import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { refreshInstitutionSession, InstitutionSession } from '../lib/institutionApi';
import * as authApi from '../lib/authApi';

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
        // CRITICAL: Check if logout just happened (prevents auto re-login)
        const logoutFlag = sessionStorage.getItem('logout_in_progress');
        if (logoutFlag) {
          sessionStorage.removeItem('logout_in_progress');
          setLoading(false);
          setInitialized(true);
          return; // Don't restore session
        }

        // Get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn('⚠️ Session error:', error);
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

          console.log('✅ Restored Supabase session:', userType);
          setUser(authUser);
          saveSession(authUser);
        } else {
          // Check localStorage for non-Supabase users (teacher/institution)
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            try {
              const parsedStored = JSON.parse(stored);
              // ONLY restore if teacher or institution AND session is still valid
              if (parsedStored.userType === 'teacher' || parsedStored.userType === 'institution') {
                console.log('✅ Restored non-Supabase session:', parsedStored.userType);
                setUser(parsedStored);
              } else {
                // Clear invalid session
                localStorage.removeItem(AUTH_STORAGE_KEY);
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse stored non-Supabase session');
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
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

  // Logout function - SECURE: Uses Worker API to clear HTTP-only cookies
  const logout = useCallback(async (options?: LogoutOptions) => {
    console.log('🚪 Logout initiated for user:', user?.userType);
    const redirectPath = options?.redirectTo ?? '/';

    // STEP 0: Set logout flag to prevent auto re-login on redirect
    sessionStorage.setItem('logout_in_progress', 'true');

    // STEP 1: Clear state IMMEDIATELY to prevent race conditions
    setUser(null);
    saveSession(null);

    // STEP 2: Clear ALL localStorage synchronously (no async)
    try {
      // Remove auth storage KEY
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('institutionSession');
      localStorage.removeItem('classViewerSession');
      localStorage.removeItem('teacherSession');
      localStorage.removeItem('parentSession');

      // Clear Supabase tokens
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('🧹 LocalStorage cleared');
    } catch (e) {
      console.warn('localStorage clear error:', e);
    }

    // STEP 3: Sign out from backend (Worker API + Supabase)
    if (user?.userType === 'student' || user?.userType === 'parent') {
      // Call Worker API to clear HTTP-only cookie (fire and forget)
      authApi.logout().catch(err => {
        console.warn('Worker logout error:', err);
      });

      // Also sign out from Supabase (fire and forget)
      supabase.auth.signOut({ scope: 'local' }).catch(err => {
        console.warn('Supabase signOut error:', err);
      });
    }

    // STEP 4: IMMEDIATE redirect (synchronous)
    console.log('✅ Redirecting to:', redirectPath);

    // Small delay to ensure storage is cleared
    setTimeout(() => {
      window.location.replace(redirectPath);
    }, 50); // 50ms delay to ensure storage cleanup completes

  }, [user, saveSession]);

  // Manual refresh session - Uses Worker API for secure token refresh
  const refreshSession = useCallback(async () => {
    try {

      // For Supabase users (student/parent) - Use Worker API
      if (user?.userType === 'student' || user?.userType === 'parent') {
        try {
          console.log('🔄 Refreshing token via Worker API (HTTP-only cookie)');
          const refreshData = await authApi.refreshToken();

          if (refreshData?.user) {
            console.log('✅ Token refreshed successfully');
            const updatedUser: AuthUser = {
              ...user,
              id: refreshData.user.id,
              email: refreshData.user.email || user.email,
              profile: refreshData.user.user_metadata || user.profile,
              metadata: refreshData.user.user_metadata || user.metadata,
            };
            setUser(updatedUser);
            saveSession(updatedUser);
          }
        } catch (error) {
          console.warn('⚠️ Worker token refresh failed, trying Supabase fallback:', error);

          // Fallback to Supabase if Worker fails
          const { data: { session }, error: supabaseError } = await supabase.auth.getSession();

          if (!supabaseError && session?.user) {
            const updatedUser: AuthUser = {
              ...user,
              id: session.user.id,
              email: session.user.email || user.email,
              profile: session.user.user_metadata,
              metadata: session.user.user_metadata,
            };
            setUser(updatedUser);
            saveSession(updatedUser);
          } else {
            console.warn('⚠️ Session refresh error:', supabaseError);
          }
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
