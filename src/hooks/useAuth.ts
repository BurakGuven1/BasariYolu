import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParentSession } from '../contexts/ParentSessionContext';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
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
      window.location.href = '/';
      return;
    }

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
        user_type: 'parent',
      },
      isParentLogin: true,
      connectedStudents: parentData.connectedStudents || [],
    };

    setUser(parentUser);
    setParentSessionUser(parentUser);
  };

  return { user, loading, clearUser, setParentUser };
};
