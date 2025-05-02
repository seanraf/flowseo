
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FeatureItem from './FeatureItem';
import { Loader2 } from 'lucide-react';

interface ChangePlanTabProps {
  subscriptionTier: 'free' | 'limited' | 'unlimited';
  onChangePlan: (plan: 'limited' | 'unlimited') => Promise<void>;
  changingPlan: boolean;
  cancelAtPeriodEnd?: boolean;
}

const ChangePlanTab: React.FC<ChangePlanTabProps> = ({ 
  subscriptionTier, 
  onChangePlan, 
  changingPlan,
  cancelAtPeriodEnd 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a New Plan</CardTitle>
        <CardDescription>
          Change your subscription plan to better suit your needs
          {cancelAtPeriodEnd && (
            <p className="mt-2 text-sm text-amber-500">
              Note: Your subscription is scheduled to cancel at the end of the billing period.
              Changing your plan will create a new subscription.
            </p>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Limited Plan */}
          <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden flex flex-col">
            <div className={`flex flex-col p-6 space-y-4 flex-1 ${subscriptionTier === 'limited' ? 'bg-muted/50' : ''}`}>
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
                disabled={subscriptionTier === 'limited' || changingPlan}
                variant={subscriptionTier === 'limited' ? "outline" : "default"}
                onClick={() => onChangePlan('limited')}
              >
                {changingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : subscriptionTier === 'limited' ? 'Current Plan' : 'Switch to Limited'}
              </Button>
            </div>
          </div>
          
          {/* Unlimited Plan */}
          <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl">
              POPULAR
            </div>
            <div className={`flex flex-col p-6 space-y-4 flex-1 ${subscriptionTier === 'unlimited' ? 'bg-muted/50' : ''}`}>
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
                variant={subscriptionTier === 'unlimited' ? "outline" : "default"}
                disabled={subscriptionTier === 'unlimited' || changingPlan}
                onClick={() => onChangePlan('unlimited')}
              >
                {changingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : subscriptionTier === 'unlimited' ? 'Current Plan' : 'Switch to Unlimited'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangePlanTab;
