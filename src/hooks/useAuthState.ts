
import { useState, useEffect, useCallback } from 'react';
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
  const [initAttempt, setInitAttempt] = useState(0);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('tempUserId');
      const newTempUser = await createTempUser();
      setTempUser(newTempUser);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTempUser = async (tempUserId: string) => {
    try {
      await migrateTempUser(tempUserId, user?.id ?? null);
      setTempUser(null);
    } catch (error) {
      console.error('Error claiming temp user:', error);
    }
  };

  const handleCreateTempUser = useCallback(async () => {
    try {
      const newTempUser = await createTempUser();
      setTempUser(newTempUser);
      return newTempUser;
    } catch (error) {
      console.error('Error creating temp user:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      if (isLoading) {
        console.log("Safety timeout triggered - forcing loading state to complete");
        setIsLoading(false);
      }
    }, 15000); // 15 seconds timeout
    
    const loadInitialUser = async () => {
      try {
        const storedTempUserId = localStorage.getItem('tempUserId');
        let tempUserData = null;

        if (storedTempUserId) {
          try {
            tempUserData = await fetchTempUser(storedTempUserId);
            setTempUser(tempUserData);
          } catch (error) {
            console.error('Error loading temp user:', error);
            localStorage.removeItem('tempUserId');
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            setProfile(profile);
            
            if (storedTempUserId && tempUserData) {
              await handleClaimTempUser(storedTempUserId);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        } else if (!tempUserData) {
          await handleCreateTempUser();
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            setProfile(profile);
          } catch (error) {
            console.error('Error fetching profile after auth change:', error);
          }
        } else {
          setProfile(null);
          if (!tempUser) {
            // Use setTimeout to avoid potential auth state conflicts
            setTimeout(() => {
              handleCreateTempUser();
            }, 0);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [initAttempt, handleCreateTempUser, tempUser]);

  // Add retry mechanism
  const retryInitialization = () => {
    setIsLoading(true);
    setInitAttempt(prev => prev + 1);
  };

  return {
    session,
    user,
    profile,
    tempUser,
    isLoading,
    signOut,
    createTempUser: handleCreateTempUser,
    claimTempUser: handleClaimTempUser,
    retryInitialization,
  };
};
