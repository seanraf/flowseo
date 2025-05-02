
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface AuthFormProps {
  mode: 'login' | 'register';
  redirectToCheckout?: boolean;
  selectedPlan?: 'limited' | 'unlimited';
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, redirectToCheckout = false, selectedPlan }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tempUser, claimTempUser, checkSubscription } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;

        // If temp user exists, claim it
        if (tempUser) {
          await claimTempUser(tempUser.id);
        }

        await checkSubscription();

        toast({
          title: 'Registration successful',
          description: 'Your account has been created. You may need to verify your email.',
        });

        if (redirectToCheckout && selectedPlan) {
          // Wait briefly to ensure auth state updates
          setTimeout(() => {
            handleRedirectToCheckout(selectedPlan);
          }, 1000);
        } else {
          navigate('/');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) throw error;
        
        await checkSubscription();
        
        toast({
          title: 'Login successful',
          description: 'Welcome back!',
        });
        
        if (redirectToCheckout && selectedPlan) {
          // Wait briefly to ensure auth state updates
          setTimeout(() => {
            handleRedirectToCheckout(selectedPlan);
          }, 1000);
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirectToCheckout = async (plan: 'limited' | 'unlimited') => {
    try {
      // Open the pricing modal programmatically after login/signup
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>
    </Form>
  );
};
