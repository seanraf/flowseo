
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Calendar, FileText, X, Check, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { PricingModal } from '@/components/PricingModal';
import LoadingScreen from '@/components/LoadingScreen';

interface SubscriptionDetails {
  id: string;
  status: string;
  tier: 'free' | 'limited' | 'unlimited';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  currency: string;
}

const Subscription = () => {
  const [activeTab, setActiveTab] = useState('current-plan');
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { user, subscriptionTier, checkSubscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchSubscriptionDetails();
  }, [user, navigate]);

  const fetchSubscriptionDetails = async () => {
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
  };

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
      setCancelDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const isFreeTier = subscriptionTier === 'free' || !subscriptionDetails;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">Subscription Management</h1>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
            <p className="font-medium">Error loading subscription details</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="current-plan" className="px-4">
              <CreditCard className="mr-2 h-4 w-4" />
              Current Plan
            </TabsTrigger>
            <TabsTrigger value="change-plan" className="px-4">
              <Calendar className="mr-2 h-4 w-4" />
              Change Plan
            </TabsTrigger>
            <TabsTrigger value="billing-history" className="px-4">
              <FileText className="mr-2 h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Current Plan Tab */}
          <TabsContent value="current-plan">
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
                          {subscriptionDetails?.tier === 'limited' ? 'Limited' : 'Unlimited'} Plan
                          <Badge variant={subscriptionDetails?.status === 'active' ? 'default' : 'outline'}>
                            {subscriptionDetails?.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                          {subscriptionDetails?.cancelAtPeriodEnd && (
                            <Badge variant="outline" className="text-destructive border-destructive">
                              Cancels at period end
                            </Badge>
                          )}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Price</p>
                        <p className="text-2xl font-bold">
                          ${subscriptionDetails?.price || (subscriptionDetails?.tier === 'limited' ? '20' : '99')}/month
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
                    </div>
                    
                    <Separator />
                    
                    <div className="pt-4">
                      <h4 className="font-medium mb-2">Plan Features</h4>
                      {subscriptionDetails?.tier === 'limited' ? (
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
                      disabled={subscriptionDetails?.cancelAtPeriodEnd || cancelling}
                    >
                      {subscriptionDetails?.cancelAtPeriodEnd ? 'Scheduled to Cancel' : 'Cancel Subscription'}
                    </Button>
                    <Button onClick={() => setActiveTab('change-plan')}>
                      Change Plan
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          {/* Change Plan Tab */}
          <TabsContent value="change-plan">
            <Card>
              <CardHeader>
                <CardTitle>Choose a New Plan</CardTitle>
                <CardDescription>
                  Change your subscription plan to better suit your needs
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
                        disabled={subscriptionTier === 'limited'}
                        variant={subscriptionTier === 'limited' ? "outline" : "default"}
                      >
                        {subscriptionTier === 'limited' ? 'Current Plan' : 'Switch to Limited'}
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
                        disabled={subscriptionTier === 'unlimited'}
                      >
                        {subscriptionTier === 'unlimited' ? 'Current Plan' : 'Switch to Unlimited'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing-history">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Manage your payment methods and view billing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
                    {isFreeTier ? (
                      <p className="text-muted-foreground">No payment methods available. Upgrade to a paid plan to add a payment method.</p>
                    ) : (
                      <div className="border rounded-md p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-3" />
                          <div>
                            <p className="font-medium">Card ending in •••• 1234</p>
                            <p className="text-sm text-muted-foreground">Expires 09/2025</p>
                          </div>
                        </div>
                        <div>
                          <Button variant="ghost" size="sm">Update</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Billing History</h3>
                    {isFreeTier ? (
                      <p className="text-muted-foreground">No billing history available.</p>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="bg-background divide-y divide-border">
                            <tr>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">May 1, 2025</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">{subscriptionTier === 'limited' ? 'Limited' : 'Unlimited'} Plan Subscription</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">${subscriptionTier === 'limited' ? '20.00' : '99.00'}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                <Button variant="link" size="sm">View</Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">April 1, 2025</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">{subscriptionTier === 'limited' ? 'Limited' : 'Unlimited'} Plan Subscription</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm">${subscriptionTier === 'limited' ? '20.00' : '99.00'}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                                <Button variant="link" size="sm">View</Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription will remain active until the end of the current billing period. After that, you will be downgraded to the free plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault();
                  handleCancelSubscription();
                }}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// Helper component for feature list items
const FeatureItem = ({ feature, available, note }: { feature: string; available: boolean; note?: string }) => (
  <div className="flex items-center">
    {available ? (
      <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
    )}
    <span className={`text-sm ${available ? '' : 'text-muted-foreground'}`}>
      {feature} {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </span>
  </div>
);

export default Subscription;
