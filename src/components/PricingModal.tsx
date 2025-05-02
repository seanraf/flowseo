import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, Loader2, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PricingModalProps {
  children: React.ReactNode;
}

export const PricingModal: React.FC<PricingModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'limited' | 'unlimited' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
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
      // Redirect to auth page with a parameter indicating they came from pricing
      navigate('/auth?from=pricing&plan=' + plan);
      setOpen(false);
      return;
    }
    setSelectedPlan(plan);
    setConfirmOpen(true);
  };

  const handleSignUp = () => {
    navigate('/auth?from=pricing&tab=register');
    setOpen(false);
  };

  const confirmSubscription = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: selectedPlan }
      });

      if (error) throw error;
      
      if (data.url) {
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
    } finally {
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

            {!user ? (
              <div className="rounded-xl border bg-card text-card-foreground shadow p-6 text-center">
                <LogIn className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Account Required</h3>
                <p className="text-muted-foreground mb-6">
                  You need to create an account or sign in before subscribing to a plan.
                </p>
                <Button onClick={handleSignUp} className="w-full md:w-auto">
                  Sign Up or Login
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Limited Plan */}
                <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden flex flex-col">
                  <div className="flex flex-col p-6 space-y-4 flex-1">
                    <h3 className="text-xl font-bold">Limited Plan</h3>
                    <div className="text-3xl font-bold">$20 <span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <p className="text-sm text-muted-foreground">For Freelancers & Small Businesses</p>
                    
                    <div className="space-y-2 flex-1">
                      <FeatureItem feature="Unlimited Keyword Research" available={true} note="(with caching)" />
                      <FeatureItem feature="15 AI-Generated Articles" available={true} />
                      <FeatureItem feature="3 Active Projects" available={true} />
                      <FeatureItem feature="Archived Projects for Data Retention" available={true} />
                      <FeatureItem feature="CSV Export of Keyword Lists" available={true} />
                      <FeatureItem feature="Basic SEO Filtering & Competitor Analysis" available={true} />
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0 mt-auto">
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe('limited')}
                    >
                      Subscribe
                    </Button>
                  </div>
                </div>
                
                {/* Unlimited Plan */}
                <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl">
                    POPULAR
                  </div>
                  <div className="flex flex-col p-6 space-y-4 flex-1">
                    <h3 className="text-xl font-bold">Unlimited Plan</h3>
                    <div className="text-3xl font-bold">$99 <span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <p className="text-sm text-muted-foreground">For Agencies & Enterprises</p>
                    
                    <div className="space-y-2 flex-1">
                      <FeatureItem feature="Unlimited Keyword Research" available={true} />
                      <FeatureItem feature="Unlimited AI Content Generation" available={true} />
                      <FeatureItem feature="Unlimited Active Projects" available={true} />
                      <FeatureItem feature="Advanced Competitive Insights & SEO Outlines" available={true} />
                      <FeatureItem feature="Priority Support" available={true} />
                      <FeatureItem feature="CSV Export & CMS Integration" available={true} />
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0 mt-auto">
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => handleSubscribe('unlimited')}
                    >
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to subscribe to the {selectedPlan === 'limited' ? 'Limited ($20/month)' : 'Unlimited ($99/month)'} plan. 
              You'll be redirected to Stripe to complete your payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={loading} onClick={confirmSubscription}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Processing
                </>
              ) : (
                'Continue to Checkout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Helper component for feature list items
const FeatureItem = ({ feature, available, note }: { feature: string; available: boolean; note?: string }) => (
  <div className="flex items-center">
    {available ? (
      <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
    )}
    <span className={`text-sm ${available ? '' : 'text-muted-foreground'}`}>
      {feature} {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </span>
  </div>
);
