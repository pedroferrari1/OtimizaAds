import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

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

    // Get the feature type from the request body
    const { feature_type } = await req.json();
    
    if (!feature_type) {
      return new Response(
        JSON.stringify({ error: 'Feature type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if there's already a metric for today
    const { data: existingMetric, error: metricError } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('metric_type', feature_type)
      .eq('date', today)
      .maybeSingle();

    if (metricError) {
      return new Response(
        JSON.stringify({ error: 'Error checking existing metric' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or insert the metric
    if (existingMetric) {
      const { error: updateError } = await supabase
        .from('usage_metrics')
        .update({
          metric_value: existingMetric.metric_value + 1,
        })
        .eq('id', existingMetric.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Error updating metric' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from('usage_metrics')
        .insert({
          metric_type: feature_type,
          metric_value: 1,
          date: today,
        });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Error inserting metric' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log AI usage metrics if applicable
    if (feature_type === 'generations' || feature_type === 'diagnostics') {
      // Get the user's current plan
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!subError && subscription) {
        // Get the default model for the user's plan
        const { data: aiConfig, error: configError } = await supabase
          .from('ai_configurations')
          .select(`
            *,
            ai_models(*)
          `)
          .eq('config_level', 'plan')
          .eq('level_identifier', subscription.plan.name)
          .eq('is_active', true)
          .maybeSingle();

        if (!configError && aiConfig && aiConfig.ai_models) {
          // Log AI usage
          const { error: usageError } = await supabase
            .from('ai_usage_metrics')
            .insert({
              user_id: user.id,
              model_name: aiConfig.ai_models.model_name,
              service_type: feature_type,
              tokens_input: feature_type === 'generations' ? 500 : 1000, // Estimated token usage
              tokens_output: feature_type === 'generations' ? 1500 : 2000, // Estimated token usage
              estimated_cost: feature_type === 'generations' ? 0.02 : 0.03, // Estimated cost
              response_time_ms: 1200, // Example response time
              success: true,
            });

          if (usageError) {
            console.error('Error logging AI usage:', usageError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error tracking usage:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});