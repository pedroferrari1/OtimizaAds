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

// Função para gerar um hash simples para uso como chave de cache
function generateCacheKey(adText: string, landingPageText: string): string {
  // Simplificado para demonstração - em produção, use um algoritmo de hash mais robusto
  const combinedText = `${adText}|${landingPageText}`;
  let hash = 0;
  for (let i = 0; i < combinedText.length; i++) {
    const char = combinedText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converte para um inteiro de 32 bits
  }
  return `funnel_analysis_${Math.abs(hash).toString(16)}`;
}

// Função para buscar resultado em cache
async function getCachedResult(cacheKey: string) {
  const { data, error } = await supabase
    .from('cache')
    .select('value, created_at')
    .eq('key', cacheKey)
    .single();
  
  if (error || !data) return null;
  
  // Verifica se o cache expirou (24 horas)
  const cacheTime = new Date(data.created_at).getTime();
  const now = new Date().getTime();
  const cacheAgeHours = (now - cacheTime) / (1000 * 60 * 60);
  
  if (cacheAgeHours > 24) return null;
  
  return data.value;
}

// Função para salvar resultado em cache
async function setCachedResult(cacheKey: string, result: any) {
  const { error } = await supabase
    .from('cache')
    .upsert({
      key: cacheKey,
      value: result,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });
  
  if (error) {
    console.error('Erro ao salvar em cache:', error);
  }
}

// Função para obter configuração de IA ativa
async function getActiveAIConfiguration() {
  // Primeiro tenta obter configuração específica para o serviço 'funnel_analysis'
  let { data: serviceConfig } = await supabase.rpc('get_active_ai_configuration', {
    level: 'service',
    identifier: 'funnel_analysis'
  });
  
  // Se não encontrar, usa a configuração global
  if (!serviceConfig) {
    const { data: globalConfig } = await supabase.rpc('get_active_ai_configuration', {
      level: 'global'
    });
    
    return globalConfig;
  }
  
  return serviceConfig;
}

// Função para registrar uso de IA
async function trackAIUsage(userId: string, modelName: string, tokensInput: number, tokensOutput: number, responseTimeMs: number, success: boolean) {
  const estimatedCost = (tokensInput + tokensOutput) * 0.00001; // Custo estimado simplificado
  
  await supabase
    .from('ai_usage_metrics')
    .insert({
      user_id: userId,
      model_name: modelName,
      service_type: 'funnel_analysis',
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      estimated_cost: estimatedCost,
      response_time_ms: responseTimeMs,
      success: success
    });
}

Deno.serve(async (req) => {
  // Lidar com solicitações CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter dados da requisição
    const { adText, landingPageText } = await req.json();
    
    // Validar dados de entrada
    if (!adText || !landingPageText) {
      return new Response(
        JSON.stringify({ error: 'Texto do anúncio e da página de destino são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário pode usar este recurso (baseado no plano)
    const canUseFeature = await checkFeatureAccess(user.id, 'funnel_analysis');
    if (!canUseFeature) {
      return new Response(
        JSON.stringify({ 
          error: 'Seu plano atual não inclui acesso ao Laboratório de Otimização de Funil. Faça upgrade para continuar.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar chave de cache
    const cacheKey = generateCacheKey(adText, landingPageText);
    
    // Verificar cache
    const cachedResult = await getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('Resultado encontrado em cache');
      return new Response(
        JSON.stringify(cachedResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter configuração de IA ativa
    const aiConfig = await getActiveAIConfiguration();
    if (!aiConfig) {
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir o prompt para o modelo de IA
    const prompt = `
Você é um especialista em marketing de performance e otimização de funis de conversão (CRO). Sua tarefa é analisar a coerência entre o texto de um anúncio e o texto de uma página de destino.

Analise os dois textos abaixo:

--- TEXTO DO ANÚNCIO ---
${adText}
--- FIM DO TEXTO DO ANÚNCIO ---

--- TEXTO DA PÁGINA DE DESTINO ---
${landingPageText}
--- FIM DO TEXTO DA PÁGINA DE DESTINO ---

Com base na sua análise, retorne um objeto JSON com a seguinte estrutura e nada mais:
{
  "funnelCoherenceScore": <um número de 0 a 10 representando a coerência entre os dois textos>,
  "adDiagnosis": "<uma análise concisa dos pontos fortes e fracos do anúncio>",
  "landingPageDiagnosis": "<uma análise concisa dos pontos fortes e fracos da página>",
  "syncSuggestions": ["<sugestão acionável 1 para melhorar a sincronia>", "<sugestão acionável 2>", "<sugestão acionável 3>", "<sugestão acionável 4>"],
  "optimizedAd": "<uma nova versão do texto do anúncio, reescrita para ser perfeitamente coerente com a página de destino>"
}
`;

    // Em uma implementação real, aqui chamaríamos a API do provedor de IA
    // Simulação para desenvolvimento da UI
    const startTime = Date.now();
    
    // Simular resposta da IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockResponse = {
      funnelCoherenceScore: 6.5,
      adDiagnosis: "O anúncio possui um bom gancho inicial e menciona o desconto de 50%, mas não detalha suficientemente os benefícios específicos do curso. A chamada para ação é clara, mas poderia ser mais urgente. Faltam elementos de prova social ou credibilidade que estão presentes na página de destino.",
      landingPageDiagnosis: "A página de destino tem um bom headline e detalha bem os benefícios do curso, incluindo os tópicos cobertos. No entanto, não enfatiza tanto o desconto de 50% que é o principal atrativo do anúncio. A página também menciona elementos (como certificado e garantia) que não aparecem no anúncio.",
      syncSuggestions: [
        "Inclua no anúncio uma menção aos tópicos específicos cobertos no curso (Facebook Ads, Google Ads, SEO) para alinhar com a página de destino.",
        "Adicione a informação sobre certificado e garantia no anúncio, já que são diferenciais importantes mencionados na página.",
        "Enfatize mais o desconto de 50% na página de destino, tornando-o tão proeminente quanto no anúncio.",
        "Utilize a mesma linguagem de urgência ('últimas vagas') tanto no anúncio quanto na página de destino."
      ],
      optimizedAd: "🔥 Curso Completo de Marketing Digital com 50% OFF! Domine Facebook Ads, Google Ads e SEO com estratégias comprovadas que transformam seu negócio. Inclui certificado e garantia de satisfação. Últimas vagas disponíveis, inscreva-se agora! 👉"
    };
    
    const responseTime = Date.now() - startTime;
    
    // Registrar uso de IA
    await trackAIUsage(
      user.id,
      aiConfig.model?.name || "modelo-simulado",
      prompt.length, // Tokens de entrada estimados
      JSON.stringify(mockResponse).length, // Tokens de saída estimados
      responseTime,
      true
    );
    
    // Incrementar contador de uso
    await incrementFeatureUsage(user.id, 'funnel_analysis');
    
    // Salvar em cache
    await setCachedResult(cacheKey, mockResponse);
    
    // Retornar resultado
    return new Response(
      JSON.stringify(mockResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro ao processar análise de funil:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar a solicitação. Por favor, tente novamente mais tarde.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para verificar se o usuário pode acessar o recurso
async function checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
  try {
    // Verificar se o usuário tem uma assinatura ativa
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    // Se não tiver assinatura, não pode usar
    if (!subscription) return false;
    
    // Verifica se o plano inclui o recurso
    const planFeatures = subscription.plan?.features || {};
    
    // Para funnel_analysis, verificamos se está explicitamente habilitado
    // ou se o plano tem acesso a recursos premium
    return !!planFeatures.funnel_analysis || !!planFeatures.premium_features;
    
  } catch (error) {
    console.error('Erro ao verificar acesso ao recurso:', error);
    return false;
  }
}

// Função para incrementar o uso de um recurso
async function incrementFeatureUsage(userId: string, feature: string) {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Verificar se já existe um registro para este período
    const { data: existingUsage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('feature_type', feature)
      .eq('period_start', periodStart.toISOString())
      .single();

    if (existingUsage) {
      // Atualizar registro existente
      await supabase
        .from('usage_tracking')
        .update({ 
          count: existingUsage.count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUsage.id);
    } else {
      // Criar novo registro
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          feature_type: feature,
          count: 1,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString()
        });
    }
  } catch (error) {
    console.error('Erro ao incrementar uso do recurso:', error);
  }
}