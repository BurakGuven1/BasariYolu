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
          console.error('❌ Error getting session:', error);
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

          console.log('✅ Session initialized:', { userType, email: authUser.email });
          setUser(authUser);
          saveSession(authUser);
        } else {
          // Check localStorage for non-Supabase users (teacher/institution)
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            try {
              const parsedStored = JSON.parse(stored);
              if (parsedStored.userType === 'teacher' || parsedStored.userType === 'institution') {
                console.log('✅ Non-Supabase user session restored:', parsedStored.userType);
                setUser(parsedStored);
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse stored non-Supabase session');
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
      console.log('🔐 Auth state change:', event);

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

        console.log('✅ User signed in:', { userType, email: authUser.email });
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
              console.log('🚪 User signed out');
              setUser(null);
              saveSession(null);
            }
          } catch (e) {
            console.log('🚪 User signed out (fallback)');
            setUser(null);
            saveSession(null);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed automatically by Supabase');
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
          console.log('✏️ User updated');
          setUser(updatedUser);
          saveSession(updatedUser);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user, saveSession]);

  // Login function
  const login = useCallback((authUser: AuthUser) => {
    console.log('👤 Login:', { userType: authUser.userType, email: authUser.email });
    setUser(authUser);
    saveSession(authUser);
  }, [saveSession]);

  // Logout function
  const logout = useCallback(async (options?: LogoutOptions) => {
    try {
      console.log('🚪 Logging out...');

      // Sign out from Supabase (only for student/parent)
      if (user?.userType === 'student' || user?.userType === 'parent') {
        await supabase.auth.signOut();
      }

      setUser(null);
      saveSession(null);

      // Clear legacy storage keys
      localStorage.removeItem('institutionSession');
      localStorage.removeItem('classViewerSession');

      // Redirect
      window.location.href = options?.redirectTo ?? '/';
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force clear and redirect even if error
      setUser(null);
      saveSession(null);
      window.location.href = options?.redirectTo ?? '/';
    }
  }, [user, saveSession]);

  // Manual refresh session (RARELY NEEDED - Supabase auto-refreshes tokens)
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Manual session refresh requested');

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
          console.log('✅ Session refreshed successfully');
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
            console.log('✅ Institution session refreshed');
          }
        } catch (error) {
          console.warn('⚠️ Institution session refresh failed:', error);
          // Keep current user
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
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
