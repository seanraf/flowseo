
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body to get options
    let { cancelAtPeriodEnd = true } = await req.json();
    logStep("Request options", { cancelAtPeriodEnd });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get customer information
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No customer found for this user");
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found for this user");
    }

    const subscription = subscriptions.data[0];
    logStep("Found active subscription", { subscriptionId: subscription.id });

    // Cancel subscription
    let updatedSubscription;
    if (cancelAtPeriodEnd) {
      // Cancel at period end
      updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });
      logStep("Subscription marked to cancel at period end", { 
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
      });
    } else {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(subscription.id);
      logStep("Subscription cancelled immediately", { subscriptionId: subscription.id });
    }

    // Update subscription status in our database
    const subscriptionEnd = new Date((updatedSubscription.current_period_end || 0) * 1000).toISOString();
    
    const { error: updateError } = await supabaseClient.from('subscribers').update({
      subscribed: cancelAtPeriodEnd, // Still true until period ends if cancelAtPeriodEnd is true
      subscription_end: subscriptionEnd,
      // Store cancel_at_period_end flag from Stripe
      subscription_tier: subscription.items.data[0].plan.nickname?.toLowerCase() || 
                        (subscription.items.data[0].price.unit_amount || 0) <= 2000 ? 'limited' : 'unlimited',
      updated_at: new Date().toISOString()
    }).eq('email', user.email);
    
    if (updateError) {
      logStep("Error updating subscriber record", { error: updateError.message });
      throw new Error(`Failed to update subscription in database: ${updateError.message}`);
    }

    logStep("Successfully updated subscription status in database", { 
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      subscriptionEnd
    });

    return new Response(JSON.stringify({ 
      success: true, 
      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
      currentPeriodEnd: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cancel-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
