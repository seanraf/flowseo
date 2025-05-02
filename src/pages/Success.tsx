
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Success = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        // Clear the checkout in progress flag
        localStorage.removeItem('checkoutInProgress');
        
        // Set a flag to indicate we've shown the success toast already
        localStorage.setItem('subscriptionActivated', 'true');
        
        // Refresh subscription status - try up to 3 times with increasing delays
        // This helps in case Stripe needs more time to update the status
        const result = await checkSubscription();
        
        if (result?.subscribed || result?.subscription_tier) {
          toast({
            title: "Subscription activated",
            description: `Thank you for your subscription! Your account has been upgraded to ${result.subscription_tier || 'premium'}.`,
          });
        } else {
          // If we haven't tried too many times yet, retry with increasing delay
          if (attempts < 3) {
            setAttempts(prev => prev + 1);
            setTimeout(() => updateSubscription(), 2000 * (attempts + 1));
            return;
          }
        }
      } catch (error) {
        console.error("Error updating subscription status:", error);
        
        // If we haven't tried too many times yet, retry with increasing delay
        if (attempts < 3) {
          setAttempts(prev => prev + 1);
          setTimeout(() => updateSubscription(), 2000 * (attempts + 1));
          return;
        }
        
        setHasError(true);
        toast({
          variant: "destructive",
          title: "Subscription status update failed",
          description: "We couldn't verify your subscription. Please contact support if the issue persists.",
        });
      } finally {
        setIsUpdating(false);
      }
    };

    updateSubscription();
  }, [checkSubscription, toast, attempts]);

  const handleBack = () => {
    // Directly navigate to the dashboard with replace to avoid back button issues
    // The replace: true is crucial here to prevent navigation history issues
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful</CardTitle>
          <CardDescription>
            Your subscription has been activated. Thank you for your payment!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>
            You now have access to all the features included in your plan.
            Your subscription will renew automatically at the end of your billing period.
          </p>
          {hasError && (
            <p className="mt-4 text-amber-500">
              We had trouble verifying your subscription status. Don't worry - your payment was processed successfully. 
              Your account will be updated shortly.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button 
            onClick={handleBack} 
            className="flex gap-2"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Subscription...
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Go to Dashboard
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Success;
