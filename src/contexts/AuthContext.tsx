
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, TempUser } from '@/types/auth';
import { createTempUser, fetchTempUser, migrateTempUser } from '@/utils/tempUser';
import { useToast } from '@/components/ui/use-toast';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tempUser: TempUser | null;
  isLoading: boolean;
  subscribed: boolean;
  subscriptionTier: 'free' | 'limited' | 'unlimited';
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  createTempUser: () => Promise<TempUser>;
  claimTempUser: (tempUserId: string) => Promise<void>;
  checkSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  tempUser: null,
  isLoading: true,
  subscribed: false,
  subscriptionTier: 'free',
  subscriptionEnd: null,
  signOut: async () => {},
  createTempUser: async () => ({ id: '', tier: 'free' }),
  claimTempUser: async () => {},
  checkSubscription: async () => {},
  openCustomerPortal: async () => {},
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
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'limited' | 'unlimited'>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('tempUserId');
      await handleCreateTempUser();
    } catch (error) {
      console.error('Sign out error:', error);
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

  const handleCreateTempUser = async () => {
    try {
      const newTempUser = await createTempUser();
      setTempUser(newTempUser);
      return newTempUser;
    } catch (error) {
      console.error('Error creating temp user:', error);
      throw error;
    }
  };

  const checkSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: {}
      });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setSubscribed(!!data.subscribed);
        if (data.subscription_tier) {
          setSubscriptionTier(data.subscription_tier as 'free' | 'limited' | 'unlimited');
        } else {
          setSubscriptionTier('free');
        }
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user]);

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please sign in to manage your subscription",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {}
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadInitialUser = async () => {
      try {
        const storedTempUserId = localStorage.getItem('tempUserId');
  
        if (storedTempUserId) {
          try {
            const tempUserData = await fetchTempUser(storedTempUserId);
            setTempUser(tempUserData);
          } catch (error) {
            console.error('Error loading temp user:', error);
            // If temp user fetch fails, we'll create a new one later if needed
          }
        }
  
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
          
          setProfile(profileData);
          
          if (storedTempUserId) {
            await handleClaimTempUser(storedTempUserId);
          }
          
          // Check subscription status
          await checkSubscription();
        } else if (!tempUser && !storedTempUserId) {
          await handleCreateTempUser();
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadInitialUser();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setProfile(profileData);
          
          // Check subscription status whenever auth state changes
          await checkSubscription();
        } else {
          setProfile(null);
          setSubscribed(false);
          setSubscriptionTier('free');
          setSubscriptionEnd(null);
          
          const storedTempUserId = localStorage.getItem('tempUserId');
          if (!tempUser && !storedTempUserId) {
            await handleCreateTempUser();
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
      subscribed,
      subscriptionTier,
      subscriptionEnd,
      signOut: handleSignOut,
      createTempUser: handleCreateTempUser,
      claimTempUser: handleClaimTempUser,
      checkSubscription,
      openCustomerPortal
    }}>
      {children}
    </AuthContext.Provider>
  );
};
