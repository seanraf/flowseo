
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export interface SubscriptionDetails {
  id: string;
  status: string;
  tier: 'free' | 'limited' | 'unlimited';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  currency: string;
}

export const useSubscription = () => {
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const { user, checkSubscription, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSubscriptionDetails = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching subscription details for user:', user.email);
      
      const { data, error } = await supabase.functions.invoke('get-subscription-details', {
        body: {}
      });
      
      console.log('Subscription details response:', { data, error });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        if (data.error) {
          throw new Error(`API Error: ${data.error}`);
        }
        setSubscriptionDetails(data);
        console.log('Successfully set subscription details:', data);
      } else {
        // No subscription found
        setSubscriptionDetails(null);
        console.log('No subscription details found');
      }
    } catch (err: any) {
      console.error("Failed to fetch subscription details:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load subscription details. Please try again later.",
        variant: "destructive",
      });
      
      // Even if there's an error, we'll check the cached subscription information from Auth context
      if (subscriptionTier && subscriptionTier !== 'free') {
        console.log('Using subscription tier from Auth context:', subscriptionTier);
        setSubscriptionDetails({
          id: 'cached',
          status: 'active',
          tier: subscriptionTier,
          currentPeriodEnd: '',
          cancelAtPeriodEnd: false,
          price: subscriptionTier === 'limited' ? 20 : 99,
          currency: 'usd'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user, subscriptionTier]);

  // Auto-fetch when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails();
    } else {
      setSubscriptionDetails(null);
      setLoading(false);
    }
  }, [user, fetchSubscriptionDetails]);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { cancelAtPeriodEnd: true }
      });
      
      if (error) throw new Error(error.message);
      
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      
      // Update subscription details with cancelAtPeriodEnd flag
      if (subscriptionDetails && data && data.success) {
        setSubscriptionDetails({
          ...subscriptionDetails,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || true,
          currentPeriodEnd: data.currentPeriodEnd || subscriptionDetails.currentPeriodEnd
        });
      }
      
      // Refresh subscription details from auth context
      await checkSubscription();
      
      return true;
    } catch (err: any) {
      console.error("Failed to cancel subscription:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to cancel subscription. Please try again later.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setCancelling(false);
    }
  };

  const handleChangePlan = async (plan: 'limited' | 'unlimited') => {
    setChangingPlan(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });
      
      if (error) throw new Error(error.message);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        // Store the fact that we're in a checkout flow
        localStorage.setItem('checkoutInProgress', 'true');
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Failed to initiate plan change:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to change plan. Please try again later.",
        variant: "destructive",
      });
      setChangingPlan(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return {
    subscriptionDetails,
    loading,
    error,
    cancelling,
    changingPlan,
    setCancelling,
    setChangingPlan,
    fetchSubscriptionDetails,
    handleCancelSubscription,
    handleChangePlan,
    formatDate,
    user,
    navigate
  };
};
