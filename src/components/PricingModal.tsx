
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PricingModalProps {
  children: React.ReactNode;
}

export const PricingModal: React.FC<PricingModalProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'limited' | 'unlimited' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = (plan: 'limited' | 'unlimited') => {
    setSelectedPlan(plan);
    setConfirmOpen(true);
  };

  const confirmSubscription = () => {
    // In a real implementation, this would redirect to Stripe
    toast({
      title: `${selectedPlan === 'limited' ? 'Limited' : 'Unlimited'} Plan Selected`,
      description: "You would be redirected to Stripe for payment in a real implementation.",
    });
    setConfirmOpen(false);
    setOpen(false);
  };

  const handleTestUnlimited = () => {
    window.location.href = '/?unlimited=true';
    setOpen(false);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* Limited Plan */}
              <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden">
                <div className="flex flex-col p-6 space-y-4">
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
                  
                  <Button 
                    className="w-full mt-auto" 
                    onClick={() => handleSubscribe('limited')}
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
              
              {/* Unlimited Plan */}
              <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl">
                  POPULAR
                </div>
                <div className="flex flex-col p-6 space-y-4">
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
                  
                  <Button 
                    className="w-full mt-auto" 
                    variant="default"
                    onClick={() => handleSubscribe('unlimited')}
                  >
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Want to see how the unlimited version works?
                </p>
                <Button variant="outline" onClick={handleTestUnlimited}>
                  Test Unlimited Version
                </Button>
              </div>
            </div>
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
              In a real implementation, you would be redirected to Stripe to complete the payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubscription}>Continue</AlertDialogAction>
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
