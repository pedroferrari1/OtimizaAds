import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'OtimizaAds',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the plan ID from the request body
    const { plan_id } = await req.json();
    
    if (!plan_id) {
      return new Response(
        JSON.stringify({ error: 'Plan ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the plan details from the database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the plan has a Stripe price ID
    if (!plan.stripe_price_id) {
      return new Response(
        JSON.stringify({ error: 'Plan does not have a Stripe price ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user already has a Stripe customer ID
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (customerError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching customer data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let customerId;

    // If the user doesn't have a Stripe customer ID, create one
    if (!customer) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });

      const { error: createCustomerError } = await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: newCustomer.id,
        });

      if (createCustomerError) {
        return new Response(
          JSON.stringify({ error: 'Error creating customer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      customerId = newCustomer.id;
    } else {
      customerId = customer.customer_id;
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/app/assinatura?success=true`,
      cancel_url: `${req.headers.get('origin')}/app/assinatura?canceled=true`,
    });

    // Return the checkout session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});