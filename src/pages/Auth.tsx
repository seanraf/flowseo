
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AuthForm } from '@/components/AuthForm';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPricing = searchParams.get('from') === 'pricing';
  const selectedPlan = searchParams.get('plan');
  const [defaultTab, setDefaultTab] = useState(fromPricing ? 'register' : 'login');

  const handleBack = () => {
    navigate('/');
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (fromPricing) {
          navigate('/');
        } else {
          navigate('/');
        }
      }
    });
  }, [navigate, fromPricing]);

  return (
    <div className="container relative flex items-center justify-center min-h-screen py-8">
      <Button 
        variant="ghost" 
        className="absolute left-4 top-4 p-0 h-10 w-10 rounded-full"
        onClick={handleBack}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome {fromPricing ? 'to FlowSEO' : 'Back'}</CardTitle>
          <CardDescription>
            {fromPricing 
              ? "Create an account to subscribe to our premium plans" 
              : "Sign in to your account or create a new one"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fromPricing && (
            <Alert className="mb-4">
              <AlertDescription>
                {selectedPlan 
                  ? `You're signing up to subscribe to our ${selectedPlan === 'limited' ? 'Limited' : 'Unlimited'} plan.` 
                  : "You need an account to subscribe to our premium plans."}
              </AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <AuthForm mode="login" redirectToCheckout={fromPricing} selectedPlan={selectedPlan || undefined} />
            </TabsContent>
            <TabsContent value="register">
              <AuthForm mode="register" redirectToCheckout={fromPricing} selectedPlan={selectedPlan || undefined} />
            </TabsContent>
          </Tabs>
        </CardContent>
        {fromPricing && (
          <CardFooter className="flex justify-center pt-0">
            <p className="text-sm text-muted-foreground">
              After creating your account, you'll be redirected to complete your subscription.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Auth;
