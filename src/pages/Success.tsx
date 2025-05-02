
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Success = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const updateSubscription = async () => {
      try {
        // Clear the checkout in progress flag
        localStorage.removeItem('checkoutInProgress');
        
        // Refresh subscription status
        await checkSubscription();
        
        toast({
          title: "Subscription activated",
          description: "Thank you for your subscription! Your account has been upgraded.",
        });
      } catch (error) {
        console.error("Error updating subscription status:", error);
      }
    };

    updateSubscription();
  }, [checkSubscription, toast]);

  const handleBack = () => {
    navigate('/');
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
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={handleBack} className="flex gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Success;
