
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Calendar, FileText, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import LoadingScreen from '@/components/LoadingScreen';
import CurrentPlanTab from '@/components/subscription/CurrentPlanTab';
import ChangePlanTab from '@/components/subscription/ChangePlanTab';
import BillingHistoryTab from '@/components/subscription/BillingHistoryTab';
import CancelSubscriptionDialog from '@/components/subscription/CancelSubscriptionDialog';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';

const Subscription = () => {
  const [activeTab, setActiveTab] = useState('current-plan');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { subscriptionTier } = useAuth();
  const { toast } = useToast();
  
  const {
    subscriptionDetails,
    loading,
    error,
    cancelling,
    changingPlan,
    fetchSubscriptionDetails,
    handleCancelSubscription,
    handleChangePlan,
    formatDate,
    user,
    navigate
  } = useSubscription();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSubscriptionDetails();
      toast({
        title: "Refreshed",
        description: "Subscription information has been updated.",
      });
    } catch (err) {
      // Error already handled in the hook
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const isFreeTier = subscriptionTier === 'free' || !subscriptionDetails;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        toggleSidebar={toggleSidebar} 
        activeConversationTitle={null} 
      />
      
      <div className="container max-w-4xl py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
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

          <TabsContent value="current-plan">
            <CurrentPlanTab 
              subscriptionDetails={subscriptionDetails}
              subscriptionTier={subscriptionTier}
              formatDate={formatDate}
              setCancelDialogOpen={setCancelDialogOpen}
              cancelling={cancelling}
              setActiveTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="change-plan">
            <ChangePlanTab 
              subscriptionTier={subscriptionTier} 
              onChangePlan={handleChangePlan}
              changingPlan={changingPlan}
              cancelAtPeriodEnd={subscriptionDetails?.cancelAtPeriodEnd}
            />
          </TabsContent>

          <TabsContent value="billing-history">
            <BillingHistoryTab 
              isFreeTier={isFreeTier}
              subscriptionTier={subscriptionTier}
            />
          </TabsContent>
        </Tabs>

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <CancelSubscriptionDialog 
            cancelling={cancelling}
            onCancel={handleCancelSubscription}
          />
        </AlertDialog>
      </div>
    </div>
  );
};

export default Subscription;
