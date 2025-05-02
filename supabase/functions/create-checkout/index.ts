
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.1.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify Stripe Key is available
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key check", { keyExists: !!stripeKey, keyLength: stripeKey.length });

    // Parse the request body
    const { plan } = await req.json();
    logStep("Processing plan", { plan });

    // Extract the token and get the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required to subscribe");
    }
    
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Authentication failed. Please sign in before subscribing.");
    }
    
    const user = userData.user;
    const email = user.email;
    
    if (!email) {
      throw new Error("User email not available. Please update your profile.");
    }
    
    logStep("Authenticated user", { userId: user.id, email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Define product details based on the plan
    let productDetails;
    if (plan === "limited") {
      productDetails = {
        name: "Limited Plan",
        price: 2000, // $20 in cents
        plan: "limited"
      };
    } else if (plan === "unlimited") {
      productDetails = {
        name: "Unlimited Plan",
        price: 9900, // $99 in cents
        plan: "unlimited"
      };
    } else {
      throw new Error(`Invalid plan: ${plan}`);
    }

    logStep("Using product", productDetails);

    // Create or retrieve customer
    let customer;
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      customer = customers.data[0];
      logStep("Using existing customer", { customerId: customer.id });
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id,
        },
      });
      logStep("Created new customer", { customerId: customer.id });
    }

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "https://pktikklryhhemfidupor.lovable.app";

    // Create checkout session directly with price_data
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: productDetails.name,
            },
            unit_amount: productDetails.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        plan,
        userId: user.id,
      },
    });
    
    logStep("Created checkout session", {
      sessionId: session.id,
      url: session.url,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error: any) {
    logStep(`Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
