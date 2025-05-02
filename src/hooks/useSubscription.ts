
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
      
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      
      // Refresh subscription details
      await checkSubscription();
      await fetchSubscriptionDetails();
    } catch (err: any) {
      console.error("Failed to cancel subscription:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to cancel subscription. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
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
    setCancelling,
    fetchSubscriptionDetails,
    handleCancelSubscription,
    formatDate,
    user,
    navigate
  };
};
