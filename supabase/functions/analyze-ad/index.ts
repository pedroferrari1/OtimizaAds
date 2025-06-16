import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Create a Supabase client for the function
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definição da interface de resposta
interface DiagnosisResponse {
  clarityScore: number;
  hookAnalysis: string;
  ctaAnalysis: string;
  mentalTriggers: string[];
  suggestions: string[];
}

// Definição da interface de requisição
interface DiagnosisRequest {
  adText: string;
  userId?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the request body
    const body: DiagnosisRequest = await req.json();
    const { adText, userId } = body;

    // Validate the request
    if (!adText || adText.trim() === "") {
      return new Response(
        JSON.stringify({
          error: "O texto do anúncio é obrigatório",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Check if user is authorized to use this feature
    if (userId) {
      const { data: usage, error: usageError } = await supabase.rpc("check_feature_usage", {
        user_uuid: userId,
        feature: "diagnostics",
      });

      if (usageError) throw usageError;

      // If user cannot use the feature, return error
      if (usage && usage[0] && !usage[0].can_use) {
        return new Response(
          JSON.stringify({
            error: "Você atingiu o limite de diagnósticos do seu plano",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
      
      // Increment usage counter if user is authenticated
      await supabase.rpc("increment_usage_counter", {
        user_uuid: userId,
        feature_type: "diagnostics",
      });
    }
    
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // In production, you would call your AI service here
    // For now, we'll just return mock data
    const diagnosisResult: DiagnosisResponse = {
      clarityScore: Math.floor(Math.random() * 3) + 7, // Random score between 7-9
      hookAnalysis: "O gancho inicial está adequado, mas poderia ser mais impactante. Considere usar uma pergunta provocativa ou uma estatística surpreendente.",
      ctaAnalysis: "A chamada para ação está presente, mas não transmite urgência. Adicione elementos de escassez ou tempo limitado.",
      mentalTriggers: ["Urgência", "Autoridade", "Prova Social"],
      suggestions: [
        "Adicione uma pergunta provocativa no início",
        "Inclua números ou estatísticas para credibilidade",
        "Reforce a chamada para ação com urgência",
        "Use mais gatilhos de prova social"
      ]
    };
    
    // Record metrics for the request
    await supabase
      .from("ai_usage_metrics")
      .insert({
        user_id: userId,
        model_name: "gpt-4o", // Exemplo
        service_type: "ad_diagnosis",
        tokens_input: adText.length / 4, // Estimativa
        tokens_output: 600, // Estimativa
        estimated_cost: 0.015, // Estimativa
        response_time_ms: 1500, 
        success: true
      });

    return new Response(
      JSON.stringify(diagnosisResult),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Ocorreu um erro ao processar sua solicitação",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});