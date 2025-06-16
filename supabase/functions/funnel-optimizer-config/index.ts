/*
  Edge Function para obter configurações do otimizador de funil
  
  Retorna configurações como limites, flags de ativação e 
  parâmetros de uso do laboratório de otimização de funil.
*/

import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Configuração de CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Função principal
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Obter configurações do sistema
    const { data: configData, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "funnel_optimizer")
      .single();
    
    if (error) {
      // Se não encontrar, retornar configurações padrão
      if (error.code === "PGRST116") { // Código para "No rows found"
        const defaultConfig = {
          enabled: true,
          maxTokens: 2048,
          temperature: 0.7,
          cacheEnabled: true,
          cacheExpiryHours: 24,
          defaultModel: "gpt-4o"
        };
        
        return new Response(
          JSON.stringify(defaultConfig),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
      
      throw error;
    }
    
    // Retornar configurações encontradas
    return new Response(
      JSON.stringify(configData.value),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error getting funnel optimizer config:", error);
    
    // Retornar erro
    return new Response(
      JSON.stringify({
        error: error.message || "Erro interno do servidor",
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