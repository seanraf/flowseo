
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const Success = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    tier: string;
    end_date?: string;
  } | null>(null);
  const navigate = useNavigate();
  const { user, checkSubscription, subscriptionTier } = useAuth();

  useEffect(() => {
    const verifySubscription = async () => {
      if (!user) {
        // Redirect to login if not authenticated
        navigate('/auth', { replace: true });
        return;
      }

      try {
        // Refresh subscription status
        await checkSubscription();
        
        // Get detailed subscription information
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          body: {}
        });
        
        if (error) throw error;
        
        if (data?.subscribed) {
          setSubscriptionDetails({
            tier: data.subscription_tier,
            end_date: data.subscription_end ? new Date(data.subscription_end).toLocaleDateString() : undefined
          });
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error verifying subscription:', err);
        setError(err.message || 'Could not verify your subscription status. Please contact support.');
        setLoading(false);
      }
    };

    verifySubscription();
  }, [user, navigate, sessionId, checkSubscription]);

  const handleContinue = () => {
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
          <CardTitle className="text-2xl font-bold">Subscription Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to FlowSEO. Your account has been upgraded.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Verifying your subscription...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="space-y-4">
              <p>
                You now have access to all premium features with the{" "}
                <span className="font-bold">
                  {subscriptionDetails?.tier || subscriptionTier || "Premium"}
                </span> plan.
              </p>
              {subscriptionDetails?.end_date && (
                <p className="text-sm text-muted-foreground">
                  Your current billing period ends on {subscriptionDetails.end_date}
                </p>
              )}
              <p className="text-sm">
                You can manage your subscription anytime through your account settings.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={handleContinue} disabled={loading} className="flex gap-2">
            Continue to Dashboard 
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Success;
