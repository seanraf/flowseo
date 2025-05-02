
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
  checkSubscription: () => Promise<any>;
  openCustomerPortal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, tempUser, isLoading, signOut, createTempUser, claimTempUser } = useAuthState();
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'limited' | 'unlimited'>('free');
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const navigate = useNavigate();

  // Use useCallback to memoize the checkSubscription function
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscriptionTier('free');
      return { subscribed: false, subscription_tier: 'free' };
    }
    
    setCheckingSubscription(true);
    try {
      console.log("Checking subscription status for user:", user.id);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: {}
      });

      if (error) {
        console.error("Error checking subscription:", error);
        setSubscriptionTier('free');
        throw error;
      } else {
        console.log("Subscription check response:", data);
        setSubscriptionTier(data?.subscription_tier || 'free');
        return data;
      }
    } catch (err) {
      console.error("Error invoking check-subscription function:", err);
      setSubscriptionTier('free');
      throw err;
    } finally {
      setCheckingSubscription(false);
    }
  }, [user]);

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
      checkSubscription().catch(err => {
        console.error("Failed to check subscription during initialization:", err);
      });
    }
  }, [user, isLoading, checkSubscription]);

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
