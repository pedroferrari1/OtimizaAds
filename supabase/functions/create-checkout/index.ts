import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecret) {
  console.error('STRIPE_SECRET_KEY não configurada');
}

const stripe = stripeSecret ? new Stripe(stripeSecret, {
  appInfo: {
    name: 'OtimizaAds',
    version: '1.0.0',
  },
}) : null;

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
    // Verificar se o Stripe está configurado
    if (!stripe) {
      console.error('Stripe não configurado - STRIPE_SECRET_KEY ausente');
      return new Response(
        JSON.stringify({ 
          error: 'Serviço de pagamento não configurado. Entre em contato com o suporte.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Cabeçalho de autorização ausente');
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the plan ID from the request body
    const { plan_id } = await req.json();
    
    if (!plan_id) {
      console.error('Plan ID ausente na requisição');
      return new Response(
        JSON.stringify({ error: 'ID do plano é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando plano:', plan_id);

    // Get the plan details from the database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError) {
      console.error('Erro ao buscar plano:', planError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar informações do plano' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!plan) {
      console.error('Plano não encontrado ou inativo:', plan_id);
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado ou não está ativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the plan has a Stripe price ID
    if (!plan.stripe_price_id) {
      console.error('Plano sem stripe_price_id:', plan.name);
      return new Response(
        JSON.stringify({ 
          error: 'Este plano não está configurado para pagamento online. Entre em contato com o suporte.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verificando cliente Stripe para usuário:', user.id);

    // Check if the user already has a Stripe customer ID
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (customerError) {
      console.error('Erro ao buscar cliente:', customerError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar dados do cliente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let customerId;

    // If the user doesn't have a Stripe customer ID, create one
    if (!customer) {
      console.log('Criando novo cliente Stripe para:', user.email);
      
      try {
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
          console.error('Erro ao salvar cliente:', createCustomerError);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar registro do cliente' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        customerId = newCustomer.id;
        console.log('Cliente criado com sucesso:', customerId);
      } catch (stripeError) {
        console.error('Erro ao criar cliente no Stripe:', stripeError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cliente no sistema de pagamento' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      customerId = customer.customer_id;
      console.log('Cliente existente encontrado:', customerId);
    }

    // Verificar se o price_id existe no Stripe
    try {
      await stripe.prices.retrieve(plan.stripe_price_id);
    } catch (stripeError) {
      console.error('Price ID inválido no Stripe:', plan.stripe_price_id, stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Configuração de preço inválida. Entre em contato com o suporte.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Criando sessão de checkout para:', {
      customer: customerId,
      price: plan.stripe_price_id,
      plan: plan.name
    });

    // Create a checkout session
    try {
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
        success_url: `${req.headers.get('origin')}/app/assinatura?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/app/assinatura?canceled=true`,
        metadata: {
          user_id: user.id,
          plan_id: plan_id,
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan_id: plan_id,
          },
        },
      });

      console.log('Sessão de checkout criada com sucesso:', session.id);

      // Return the checkout session URL
      return new Response(
        JSON.stringify({ 
          url: session.url,
          session_id: session.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (stripeError) {
      console.error('Erro ao criar sessão de checkout:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar sessão de pagamento. Tente novamente.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Erro geral na função create-checkout:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor. Tente novamente mais tarde.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});