import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const lastAuthState = useRef<string>('');

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const checkParentUser = () => {
      const tempParentUser = localStorage.getItem('tempParentUser');
      if (tempParentUser) {
        try {
          const parentData = JSON.parse(tempParentUser);
          setUser({
            id: parentData.id,
            email: parentData.email,
            profile: {
              full_name: parentData.full_name || 'Veli',
              user_type: 'parent'
            },
            isParentLogin: true,
            connectedStudents: parentData.connectedStudents || []
          });
          setLoading(false);
          return true; // Parent user bulundu
        } catch (err) {
          console.error('❌ Error parsing parent user:', err);
          localStorage.removeItem('tempParentUser');
        }
      }
      return false; // Parent user yok
    };

    // Parent user varsa normal auth'u atla
    if (checkParentUser()) {
      return;
    }

    // ✅ 2. Normal Supabase auth
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

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          profile: session.user.user_metadata
        });
      } else {
        // ✅ Parent user varsa silme
        const tempParentUser = localStorage.getItem('tempParentUser');
        if (!tempParentUser) {
          setUser(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      isInitialized.current = false;
    };
  }, []);

  const clearUser = async () => {
    
    if (user?.isParentLogin) {
      localStorage.removeItem('tempParentUser');
      setUser(null);
      window.location.href = '/';
      return;
    }
    
    // Normal user için Supabase signOut
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  const setParentUser = (parentData: any) => {
    const parentUser = {
      id: parentData.id || `parent_${Date.now()}`,
      email: parentData.email || '',
      profile: {
        full_name: parentData.full_name || 'Veli',
        user_type: 'parent'
      },
      isParentLogin: true,
      connectedStudents: parentData.connectedStudents || []
    };
    
    setUser(parentUser);
    localStorage.setItem('tempParentUser', JSON.stringify(parentData));
  };

  return { user, loading, clearUser, setParentUser };
};