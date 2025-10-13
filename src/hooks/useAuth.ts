import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const lastAuthState = useRef<string>('');

  useEffect(() => {
    // Sadece bir kere çalışsın
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('🔵 useAuth initialized');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          profile: session.user.user_metadata
        });
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newState = session?.user?.id || 'signed_out';
      
      // Aynı state tekrar geliyorsa ignore et
      if (lastAuthState.current === newState) return;
      lastAuthState.current = newState;

      console.log('🔔 Auth changed:', _event);

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          profile: session.user.user_metadata
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, []);

  const clearUser = async () => {
    console.log('🔴 clearUser called');
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const setParentUser = (parentData: any) => {
    console.log('👨‍👩‍👧 Setting parent user:', parentData);
    setUser({
      id: parentData.id || `parent_${Date.now()}`,
      email: parentData.email || '',
      profile: {
        full_name: parentData.full_name || 'Veli',
        user_type: 'parent'
      },
      isParentLogin: true,
      connectedStudents: parentData.connectedStudents || []
    });
    localStorage.setItem('tempParentUser', JSON.stringify(parentData));
  };

  return { user, loading, clearUser, setParentUser };
};