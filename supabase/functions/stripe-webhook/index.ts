import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'OtimizaAds',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
    // Verificar assinatura do webhook
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Assinatura do webhook não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter o corpo da requisição
    const body = await req.text();
    
    // Construir o evento do Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Erro na verificação da assinatura do webhook: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Erro na verificação da assinatura do webhook: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar o evento
    console.log(`Evento recebido: ${event.type}`);
    
    // Processar eventos em segundo plano
    EdgeRuntime.waitUntil(handleStripeEvent(event));

    // Responder ao Stripe imediatamente
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleStripeEvent(event: Stripe.Event) {
  const { type, data } = event;

  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data.object as Stripe.Subscription);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Evento não processado: ${type}`);
    }
  } catch (error) {
    console.error(`Erro ao processar evento ${type}:`, error);
    // Registrar erro no banco de dados para análise posterior
    await supabase.from('error_logs').insert({
      error_type: 'webhook_processing',
      error_message: `Erro ao processar evento ${type}: ${error.message}`,
      stack_trace: error.stack,
      endpoint: 'stripe-webhook',
    });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processando checkout.session.completed:', session.id);
  
  const customerId = session.customer as string;
  
  if (session.mode === 'subscription') {
    // Atualizar status da assinatura
    const subscriptionId = session.subscription as string;
    
    // Buscar detalhes da assinatura
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Atualizar no banco de dados
    await updateSubscriptionInDatabase(subscription);
    
    // Registrar evento de assinatura criada
    await logSubscriptionEvent(customerId, 'subscription_created', {
      subscription_id: subscriptionId,
      plan: subscription.items.data[0].price.id,
    });
  } else if (session.mode === 'payment') {
    // Processar pagamento único
    await processOneTimePayment(session);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processando subscription updated:', subscription.id);
  
  // Atualizar no banco de dados
  await updateSubscriptionInDatabase(subscription);
  
  // Registrar evento de assinatura atualizada
  await logSubscriptionEvent(subscription.customer as string, 'subscription_updated', {
    subscription_id: subscription.id,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processando subscription deleted:', subscription.id);
  
  const customerId = subscription.customer as string;
  
  // Atualizar status no banco de dados
  const { error } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('customer_id', customerId);
  
  if (error) {
    console.error('Erro ao atualizar status da assinatura:', error);
    throw error;
  }
  
  // Registrar evento de assinatura cancelada
  await logSubscriptionEvent(customerId, 'subscription_canceled', {
    subscription_id: subscription.id,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Processando invoice paid:', invoice.id);
  
  if (invoice.subscription) {
    // Atualizar período da assinatura
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await updateSubscriptionInDatabase(subscription);
  }
  
  // Registrar pagamento bem-sucedido
  await logSubscriptionEvent(invoice.customer as string, 'payment_succeeded', {
    invoice_id: invoice.id,
    amount_paid: invoice.amount_paid,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processando invoice payment failed:', invoice.id);
  
  // Registrar falha de pagamento
  await logSubscriptionEvent(invoice.customer as string, 'payment_failed', {
    invoice_id: invoice.id,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt,
  });
}

async function updateSubscriptionInDatabase(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  // Buscar usuário pelo customer_id
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();
  
  if (!customerData) {
    console.error(`Cliente não encontrado para customer_id: ${customerId}`);
    return;
  }
  
  const userId = customerData.user_id;
  
  // Obter o primeiro item da assinatura (assumindo que só há um)
  const item = subscription.items.data[0];
  const priceId = item.price.id;
  
  // Buscar plano pelo price_id
  const { data: planData } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();
  
  if (!planData) {
    console.error(`Plano não encontrado para price_id: ${priceId}`);
    return;
  }
  
  // Atualizar a assinatura no Stripe
  const { error: stripeSubError } = await supabase
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: priceId,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'customer_id',
    });
  
  if (stripeSubError) {
    console.error('Erro ao atualizar stripe_subscriptions:', stripeSubError);
    throw stripeSubError;
  }
  
  // Atualizar a assinatura do usuário
  const { error: userSubError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planData.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });
  
  if (userSubError) {
    console.error('Erro ao atualizar user_subscriptions:', userSubError);
    throw userSubError;
  }
}

async function processOneTimePayment(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  
  // Inserir na tabela stripe_orders
  const { error } = await supabase
    .from('stripe_orders')
    .insert({
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent as string,
      customer_id: customerId,
      amount_subtotal: session.amount_subtotal || 0,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'brl',
      payment_status: session.payment_status || 'unpaid',
      status: 'completed',
    });
  
  if (error) {
    console.error('Erro ao inserir pedido:', error);
    throw error;
  }
}

async function logSubscriptionEvent(customerId: string, eventType: string, details: any) {
  // Buscar usuário pelo customer_id
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('customer_id', customerId)
    .single();
  
  if (!customerData) {
    console.error(`Cliente não encontrado para customer_id: ${customerId}`);
    return;
  }
  
  // Registrar no log de auditoria
  await supabase
    .from('audit_logs')
    .insert({
      action: `stripe_${eventType}`,
      target_user_id: customerData.user_id,
      details,
    });
}