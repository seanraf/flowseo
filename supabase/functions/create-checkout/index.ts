
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.1.1";

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
    const { plan, tempUserId } = await req.json();
    logStep("Processing plan", { plan, tempUserId });

    let email = "";
    let customerId = "";
    let user = null;
    
    // Check if this is a temp user or logged-in user
    if (tempUserId) {
      // Use a temp email based on the tempUserId
      email = `temp_${tempUserId}@flowseo.app`;
      logStep("Using temp user", { tempUserId, email });
    } else {
      // Extract the token and get the user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header provided");
      }
      
      // We'll implement this later if needed
      // For now, just use the temp user flow
      logStep("No auth header or using temp user flow");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Define product details based on the plan
    let productDetails;
    if (plan === "limited") {
      productDetails = {
        productId: "prod_SBvI46y2KqRMr2", // User's test product ID
        plan: "limited"
      };
    } else if (plan === "unlimited") {
      productDetails = {
        productId: "prod_SBvI4ATCgacOfn", // User's test product ID
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
          tempUserId,
        },
      });
      logStep("Created new customer", { customerId: customer.id });
    }

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create a checkout session using the specified product ID
    let session;
    try {
      // First try to get prices for the specific product
      const prices = await stripe.prices.list({
        product: productDetails.productId,
        active: true,
        limit: 1,
      });

      if (prices.data.length === 0) {
        throw new Error(`No active prices found for product ${productDetails.productId}`);
      }

      // Use the price associated with the product
      const price = prices.data[0];
      logStep("Found price for product", { priceId: price.id, productId: productDetails.productId });
      
      session = await stripe.checkout.sessions.create({
        customer: customer.id,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cancel`,
        metadata: {
          plan,
          tempUserId: tempUserId || "",
        },
      });
      
      logStep("Created checkout session", {
        sessionId: session.id,
        priceId: price.id,
        url: session.url,
      });
    } catch (error) {
      logStep(`Error creating checkout session: ${error.message}`);
      
      // Fallback to creating a session with a simple price
      const pricingInfo = {
        limited: { amount: 2000, name: "Limited Plan" },
        unlimited: { amount: 9900, name: "Unlimited Plan" }
      };
      
      const planInfo = pricingInfo[plan as keyof typeof pricingInfo];
      
      session = await stripe.checkout.sessions.create({
        customer: customer.id,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: planInfo.name,
                id: productDetails.productId,
              },
              unit_amount: planInfo.amount,
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
          tempUserId: tempUserId || "",
        },
      });
      
      logStep("Created checkout session with fallback price", {
        sessionId: session.id,
        url: session.url,
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    logStep(`Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
