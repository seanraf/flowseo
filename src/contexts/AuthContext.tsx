
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextProps {
  user: any;
  profile: any;
  tempUser: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
  createTempUser: () => Promise<any>;
  claimTempUser: (tempUserId: string) => Promise<void>;
  subscriptionTier: 'free' | 'limited' | 'unlimited';
  checkSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, tempUser, isLoading, signOut, createTempUser, claimTempUser } = useAuthState();
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'limited' | 'unlimited'>('free');
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const navigate = useNavigate();

  const checkSubscription = async () => {
    if (user) {
      setCheckingSubscription(true);
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: {}
        });

        if (error) {
          console.error("Error checking subscription:", error);
          setSubscriptionTier('free');
        } else {
          setSubscriptionTier(data?.subscription_tier || 'free');
        }
      } catch (err) {
        console.error("Error invoking check-subscription function:", err);
        setSubscriptionTier('free');
      } finally {
        setCheckingSubscription(false);
      }
    } else {
      setSubscriptionTier('free');
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {}
      });
      
      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.redirectToPricing) {
        navigate('/?showPricing=true', { replace: true });
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      checkSubscription();
    }
  }, [user, isLoading]);

  const value: AuthContextProps = {
    user,
    profile,
    tempUser,
    isLoading: isLoading || checkingSubscription,
    signOut,
    createTempUser,
    claimTempUser,
    subscriptionTier,
    checkSubscription,
    openCustomerPortal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
