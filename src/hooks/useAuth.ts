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

  // 🚀 İlk yüklemede session kontrolü
  useEffect(() => {
    if (initialized) return;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        // 🔹 Geçici veli oturumu kontrolü
        const tempParent = localStorage.getItem('tempParentUser');
        if (tempParent) {
          const parentUser = JSON.parse(tempParent);
          setUser(parentUser);
          return;
        }

        // 🔹 Supabase oturumu kontrolü
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            profile,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, [initialized]);

  // 🎧 Auth state değişimlerini dinle
  useEffect(() => {
    if (!initialized) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        // 🔹 Eğer veli login varsa, Supabase state'i ezmesin
        const tempParent = localStorage.getItem('tempParentUser');
        if (tempParent) {
          setUser(JSON.parse(tempParent));
          return;
        }

        // 🔹 Supabase logout
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('tempParentUser');
          setUser(null);
          return;
        }

        // 🔹 Supabase login
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            profile,
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialized]);

  // 👨‍👩‍👧 Geçici veli oturumu
  const setParentUser = (parentUser: any) => {
    if (parentUser?.isParentLogin) {
      localStorage.setItem('tempParentUser', JSON.stringify(parentUser));
    }
    setUser(parentUser);
  };

  // 🚪 Logout fonksiyonu (App tarafından çağrılacak)
  const clearUser = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('tempParentUser');
      setInitialized(false);
      setUser(null);
    }
  };

  return { user, loading, setParentUser, clearUser };
};
