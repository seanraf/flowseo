
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserTier = 'free' | 'limited' | 'unlimited';

interface Profile {
  id: string;
  email: string;
  tier: UserTier;
}

interface TempUser {
  id: string;
  tier: UserTier;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tempUser: TempUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  createTempUser: () => Promise<TempUser>;
  claimTempUser: (tempUserId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  tempUser: null,
  isLoading: true,
  signOut: async () => {},
  createTempUser: async () => ({ id: '', tier: 'free' }),
  claimTempUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tempUser, setTempUser] = useState<TempUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createTempUser = async () => {
    try {
      // Set temporary session in localStorage
      const { data, error } = await supabase
        .from('temp_users')
        .insert({ tier: 'free' })
        .select()
        .single();

      if (error) throw error;

      const newTempUser = { 
        id: data.id, 
        tier: data.tier as UserTier 
      };

      setTempUser(newTempUser);
      localStorage.setItem('tempUserId', newTempUser.id);
      return newTempUser;
    } catch (error) {
      console.error('Error creating temp user:', error);
      throw error;
    }
  };

  const claimTempUser = async (tempUserId: string) => {
    try {
      // Call the server-side function to migrate temp user data
      const { error } = await supabase.rpc('migrate_temp_user_to_profile', {
        temp_user_id: tempUserId,
        user_id: user?.id
      });

      if (error) throw error;

      // Clear temp user from localStorage
      localStorage.removeItem('tempUserId');
      setTempUser(null);
    } catch (error) {
      console.error('Error claiming temp user:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Optional: create a new temp user on logout
    localStorage.removeItem('tempUserId');
    await createTempUser();
  };

  useEffect(() => {
    const loadInitialUser = async () => {
      // Check for existing temp user in localStorage
      const storedTempUserId = localStorage.getItem('tempUserId');

      if (storedTempUserId) {
        try {
          const { data, error } = await supabase
            .from('temp_users')
            .select('*')
            .eq('id', storedTempUserId)
            .single();

          if (data) {
            setTempUser({ 
              id: data.id, 
              tier: data.tier as UserTier 
            });
          }
        } catch (error) {
          console.error('Error loading temp user:', error);
        }
      }

      // Load authenticated user session
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
        
        // If user is logged in and there's a temp user, attempt to migrate
        if (storedTempUserId) {
          await claimTempUser(storedTempUserId);
        }
      } else if (!tempUser) {
        // If no authenticated user and no temp user, create one
        await createTempUser();
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
          // Ensure a temp user exists when logged out
          if (!tempUser) {
            await createTempUser();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      tempUser, 
      isLoading, 
      signOut, 
      createTempUser,
      claimTempUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
