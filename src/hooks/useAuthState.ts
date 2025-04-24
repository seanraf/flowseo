
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, TempUser } from '@/types/auth';
import { createTempUser, fetchTempUser, migrateTempUser } from '@/utils/tempUser';

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tempUser, setTempUser] = useState<TempUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tempUserId');
    await createTempUser();
  };

  const handleClaimTempUser = async (tempUserId: string) => {
    await migrateTempUser(tempUserId, user?.id ?? null);
    setTempUser(null);
  };

  const handleCreateTempUser = async () => {
    const newTempUser = await createTempUser();
    setTempUser(newTempUser);
    return newTempUser;
  };

  useEffect(() => {
    const loadInitialUser = async () => {
      const storedTempUserId = localStorage.getItem('tempUserId');

      if (storedTempUserId) {
        try {
          const tempUserData = await fetchTempUser(storedTempUserId);
          setTempUser(tempUserData);
        } catch (error) {
          console.error('Error loading temp user:', error);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(profile);
        
        if (storedTempUserId) {
          await handleClaimTempUser(storedTempUserId);
        }
      } else if (!tempUser) {
        await handleCreateTempUser();
      }

      setIsLoading(false);
    };

    loadInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profile);
        } else {
          setProfile(null);
          if (!tempUser) {
            await handleCreateTempUser();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    profile,
    tempUser,
    isLoading,
    signOut,
    createTempUser: handleCreateTempUser,
    claimTempUser: handleClaimTempUser,
  };
};
