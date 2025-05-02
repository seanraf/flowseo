
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
  console.log(`[GET-SUBSCRIPTION] ${step}${detailsStr}`);
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

    // First check if we have subscription data in the subscribers table
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('subscribed', true)
      .maybeSingle();

    logStep("Checked subscribers table", { 
      hasData: !!subscriberData, 
      error: subscriberError?.message || null
    });

    // If we have valid subscriber data and it's recent (updated within last day), use that
    if (subscriberData && 
        subscriberData.subscription_tier && 
        subscriberData.subscribed && 
        new Date(subscriberData.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      
      logStep("Using cached subscription data from database", subscriberData);
      
      return new Response(JSON.stringify({
        id: subscriberData.id,
        status: "active",
        tier: subscriberData.subscription_tier,
        currentPeriodEnd: subscriberData.subscription_end,
        cancelAtPeriodEnd: false, // Default as we don't store this
        price: 0, // Default as we don't store this
        currency: "usd" // Default as we don't store this
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("No recent subscriber data, checking Stripe directly");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get customer information from Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No customer found in Stripe");
      return new Response(JSON.stringify(null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get subscription information from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
      expand: ['data.default_payment_method', 'data.items.data.price.product']
    });

    if (subscriptions.data.length === 0) {
      logStep("No subscription found in Stripe");
      return new Response(JSON.stringify(null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    logStep("Found subscription in Stripe", { 
      subscriptionId: subscription.id, 
      status: subscription.status 
    });

    // Determine subscription tier based on price
    let tier = 'free';
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    if (amount <= 2000) {
      tier = 'limited';
    } else {
      tier = 'unlimited';
    }

    logStep("Determined tier from price", { amount, tier });

    // Update the subscribers table with the latest information
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: subscription.status === 'active',
      subscription_tier: tier,
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated subscribers table with latest information");

    // Format response data
    const subscriptionDetails = {
      id: subscription.id,
      status: subscription.status,
      tier: tier,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      price: amount ? amount / 100 : 0,
      currency: price.currency || 'usd'
    };

    logStep("Returning subscription details", subscriptionDetails);
    return new Response(JSON.stringify(subscriptionDetails), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-subscription-details", { message: errorMessage });
    
    // Send detailed error information for troubleshooting
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      details: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
