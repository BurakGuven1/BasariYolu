import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthUser extends User {
  profile?: any;
  isParentLogin?: boolean;
  connectedStudents?: any[];
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return; // Prevent re-initialization

    // Check current session once
    const initializeAuth = async () => {
      try {
        // Check for temporary parent login first
        const tempParent = localStorage.getItem('tempParentUser');
        if (tempParent) {
          const parentUser = JSON.parse(tempParent);
          setUser(parentUser);
          setLoading(false);
          setInitialized(true);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get profile data for the user
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            ...session.user,
            profile
          });
        } else {
          setUser(null);
        }
        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return; // Don't set up listener until initialized

    // Listen for auth changes - but don't cause loops
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Ignore initial SIGNED_IN event if we already have a user
        if (event === 'SIGNED_IN' && user) {
          return;
        }
        
        // Check for temporary parent login first - don't override it
        const tempParent = localStorage.getItem('tempParentUser');
        if (tempParent) {
          const parentUser = JSON.parse(tempParent);
          setUser(parentUser);
          setLoading(false);
          return;
        }
        
        // Clear temp parent on sign out
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('tempParentUser');
        }
        
        if (session?.user) {
          // Get profile data for the user
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            ...session.user,
            profile
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [initialized, user]);

  // Function to set temporary parent user
  const setParentUser = (parentUser: any) => {
    // Update localStorage as well
    if (parentUser.isParentLogin) {
      localStorage.setItem('tempParentUser', JSON.stringify(parentUser));
    }
    setUser(parentUser);
  };

  // Function to clear user (for logout)
  const clearUser = () => {
    localStorage.removeItem('tempParentUser');
    setInitialized(false);
    setUser(null);
  };
  return { user, loading, setParentUser, clearUser };
};