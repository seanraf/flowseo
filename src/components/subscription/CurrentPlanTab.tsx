
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, RefreshCw } from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';
import FeatureItem from './FeatureItem';

interface SubscriptionDetails {
  id: string;
  status: string;
  tier: 'free' | 'limited' | 'unlimited';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  currency: string;
}

interface CurrentPlanTabProps {
  subscriptionDetails: SubscriptionDetails | null;
  subscriptionTier: 'free' | 'limited' | 'unlimited';
  formatDate: (dateString: string) => string;
  setCancelDialogOpen: (open: boolean) => void;
  cancelling: boolean;
  setActiveTab: (tab: string) => void;
}

const CurrentPlanTab: React.FC<CurrentPlanTabProps> = ({
  subscriptionDetails,
  subscriptionTier,
  formatDate,
  setCancelDialogOpen,
  cancelling,
  setActiveTab
}) => {
  // Determine the actual tier from both sources
  // First check subscription details from API, then fall back to auth context
  const actualTier = subscriptionDetails?.tier || subscriptionTier;
  const isFreeTier = actualTier === 'free' || !subscriptionDetails;
  const isCancelled = subscriptionDetails?.cancelAtPeriodEnd || false;
  
  console.log('Current plan tab rendering with:', { 
    subscriptionDetails, 
    subscriptionTier, 
    actualTier, 
    isFreeTier,
    isCancelled
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Current Subscription</CardTitle>
        <CardDescription>
          View and manage your current subscription details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isFreeTier ? (
          <div className="text-center py-8">
            <div className="inline-block p-4 rounded-full bg-muted mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Free Plan</h3>
            <p className="text-muted-foreground mb-6">
              You are currently on the free plan with limited features.
            </p>
            <PricingModal>
              <Button className="mx-auto">Upgrade Now</Button>
            </PricingModal>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {actualTier === 'limited' ? 'Limited' : 'Unlimited'} Plan
                  <Badge variant={subscriptionDetails?.status === 'active' ? 'default' : 'outline'}>
                    {subscriptionDetails?.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  {isCancelled && (
                    <Badge variant="outline" className="text-destructive border-destructive">
                      Cancels at period end
                    </Badge>
                  )}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-2xl font-bold">
                  ${subscriptionDetails?.price || (actualTier === 'limited' ? '20' : '99')}/month
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Period</p>
              <p className="font-medium">
                Active until: {subscriptionDetails?.currentPeriodEnd ? 
                  formatDate(subscriptionDetails.currentPeriodEnd) : 
                  'Not available'}
              </p>
              {isCancelled && (
                <p className="text-sm text-destructive mt-1">
                  Your subscription will be canceled at the end of the current period.
                </p>
              )}
            </div>
            
            <Separator />
            
            <div className="pt-4">
              <h4 className="font-medium mb-2">Plan Features</h4>
              {actualTier === 'limited' ? (
                <ul className="space-y-2">
                  <FeatureItem feature="Unlimited Keyword Research" available={true} note="(with caching)" />
                  <FeatureItem feature="15 AI-Generated Articles" available={true} />
                  <FeatureItem feature="3 Active Projects" available={true} />
                  <FeatureItem feature="Archived Projects for Data Retention" available={true} />
                  <FeatureItem feature="CSV Export of Keyword Lists" available={true} />
                  <FeatureItem feature="Basic SEO Filtering & Competitor Analysis" available={true} />
                </ul>
              ) : (
                <ul className="space-y-2">
                  <FeatureItem feature="Unlimited Keyword Research" available={true} />
                  <FeatureItem feature="Unlimited AI Content Generation" available={true} />
                  <FeatureItem feature="Unlimited Active Projects" available={true} />
                  <FeatureItem feature="Advanced Competitive Insights & SEO Outlines" available={true} />
                  <FeatureItem feature="Priority Support" available={true} />
                  <FeatureItem feature="CSV Export & CMS Integration" available={true} />
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {!isFreeTier && (
        <CardFooter>
          <div className="w-full flex flex-col sm:flex-row gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(true)}
              disabled={isCancelled || cancelling}
            >
              {isCancelled ? 'Scheduled to Cancel' : 'Cancel Subscription'}
            </Button>
            <Button onClick={() => setActiveTab('change-plan')}>
              Change Plan
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default CurrentPlanTab;
