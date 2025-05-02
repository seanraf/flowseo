
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface BillingHistoryTabProps {
  isFreeTier: boolean;
  subscriptionTier: 'free' | 'limited' | 'unlimited';
}

const BillingHistoryTab: React.FC<BillingHistoryTabProps> = ({ isFreeTier, subscriptionTier }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { openCustomerPortal } = useAuth();

  const handleManagePaymentMethods = async () => {
    if (isFreeTier) {
      return;
    }
    
    setLoading(true);
    try {
      await openCustomerPortal();
    } catch (error: any) {
      console.error("Failed to open customer portal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
                    <p className="font-medium">Credit Card</p>
                    <p className="text-sm text-muted-foreground">
                      To view card details, manage or update payment methods, click the button below.
                    </p>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleManagePaymentMethods}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Manage Payment Methods'
                    )}
                  </Button>
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
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  To view your complete billing history and download invoices, please visit the Customer Portal.
                </p>
                <Button 
                  onClick={handleManagePaymentMethods}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'View Billing History'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingHistoryTab;
