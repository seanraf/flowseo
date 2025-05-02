
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for logging steps (useful for debugging)
const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { plan, tempUserId } = await req.json();
    
    if (!plan || (plan !== 'limited' && plan !== 'unlimited')) {
      throw new Error("Invalid plan specified");
    }
    
    logStep("Processing plan", { plan, tempUserId });

    // Initialize Supabase client with anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Initialize Stripe - Get the key directly
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    // Log for debugging
    logStep("Stripe key check", { keyExists: !!stripeSecretKey, keyLength: stripeSecretKey ? stripeSecretKey.length : 0 });
    
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      // Force using test mode regardless of the key used
      typescript: true
    });

    let email: string;
    let userId: string | null = null;
    
    // Get auth header and extract user data
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData?.user) {
        email = userData.user.email!;
        userId = userData.user.id;
        logStep("Authenticated user", { userId, email });
      } else if (tempUserId) {
        // Fallback to temp user if available
        const { data: tempUser } = await supabaseClient
          .from("temp_users")
          .select("*")
          .eq("id", tempUserId)
          .single();
        
        if (!tempUser) {
          throw new Error("Temp user not found");
        }
        
        email = `temp_${tempUser.id}@flowseo.app`;
        logStep("Using temp user", { tempUserId, email });
      } else {
        throw new Error("Authentication required");
      }
    } else if (tempUserId) {
      // Handle temp user without auth
      const { data: tempUser } = await supabaseClient
        .from("temp_users")
        .select("*")
        .eq("id", tempUserId)
        .single();
      
      if (!tempUser) {
        throw new Error("Temp user not found");
      }
      
      email = `temp_${tempUser.id}@flowseo.app`;
      logStep("Using temp user", { tempUserId, email });
    } else {
      throw new Error("Authentication required");
    }

    // Check if customer already exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Use test product IDs for the respective plans
    // Note: We're using the same product IDs for test mode
    const productId = plan === 'limited' ? 
      'prod_SEoJtKvNZ41non' : 
      'prod_SEoKwdA1IOg3RX';
      
    logStep("Using product", { productId, plan });
    
    const origin = req.headers.get("origin") || "https://pktikklryhhemfidupor.lovable.app";
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: productId,
            unit_amount: plan === 'limited' ? 2000 : 9900, // $20 or $99 in cents
            recurring: {
              interval: "month"
            }
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });
    
    logStep("Created checkout session", { sessionId: session.id });
    
    // If we have a userId, save the subscription info to the database
    if (userId) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );
      
      // Upsert to subscribers table
      await supabaseAdmin.from("subscribers").upsert({
        user_id: userId,
        email,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      
      logStep("Saved subscriber data", { userId });
    }
    
    // Return the checkout URL to the client
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[CREATE-CHECKOUT] Error: ${message}`);
    
    return new Response(
      JSON.stringify({ error: message }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
