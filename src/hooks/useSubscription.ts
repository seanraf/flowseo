
import { useState, useCallback } from 'react';
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
  const { user, checkSubscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchSubscriptionDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-subscription-details', {
        body: {}
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        setSubscriptionDetails(data);
      } else {
        // No subscription found
        setSubscriptionDetails(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch subscription details:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load subscription details. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
