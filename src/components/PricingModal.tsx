
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import PricingPlans from './pricing/PricingPlans';
import SubscriptionConfirmDialog from './pricing/SubscriptionConfirmDialog';

interface PricingModalProps {
  children: React.ReactNode;
}

export const PricingModal: React.FC<PricingModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'limited' | 'unlimited' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const { user, checkSubscription } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const showPricing = searchParams.get('showPricing') === 'true';

  // Open the pricing modal automatically if the URL parameter is present
  useEffect(() => {
    if (showPricing) {
      setOpen(true);
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showPricing');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [showPricing]);

  const handleSubscribe = (plan: 'limited' | 'unlimited') => {
    if (!user) {
      // Navigate to auth page with a parameter indicating they came from pricing
      window.location.href = `/auth?from=pricing&plan=${plan}`;
      setOpen(false);
      return;
    }
    setSelectedPlan(plan);
    setConfirmOpen(true);
  };

  const handleSignUp = () => {
    window.location.href = '/auth?from=pricing&tab=register';
    setOpen(false);
  };

  const confirmSubscription = async () => {
    try {
      setLoading(true);
      
      // Map selected plan to product ID
      const productId = selectedPlan === 'limited' 
        ? 'prod_SBvI46y2KqRMr2' 
        : 'prod_SBvI4ATCgacOfn';
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: selectedPlan, productId }
      });

      if (error) throw error;
      
      if (data.url) {
        // Store the fact that we're in a checkout flow
        localStorage.setItem('checkoutInProgress', 'true');
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Choose Your Plan</h2>
              <p className="text-sm text-muted-foreground">
                Select the plan that works best for your SEO needs.
              </p>
            </div>

            <PricingPlans 
              user={user} 
              onSignUp={handleSignUp} 
              onSelectPlan={handleSubscribe} 
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <SubscriptionConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        selectedPlan={selectedPlan}
        loading={loading}
        onConfirm={confirmSubscription}
      />
    </>
  );
};
