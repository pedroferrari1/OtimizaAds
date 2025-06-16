import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { createHash } from 'node:crypto';

// Configuração do cliente Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Configurações de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Configurações de cache
const CACHE_EXPIRY_HOURS = 24;
const CACHE_TABLE = 'system_cache';

// Função para gerar hash SHA-256 para chaves de cache
function generateCacheKey(adText: string, landingPageText: string): string {
  const combinedText = `${adText}|${landingPageText}`;
  const hash = createHash('sha256').update(combinedText).digest('hex');
  return `funnel_analysis_${hash}`;
}

// Função para buscar resultado em cache
async function getCachedResult(cacheKey: string) {
  const { data, error } = await supabase
    .from(CACHE_TABLE)
    .select('value, created_at')
    .eq('key', cacheKey)
    .single();
  
  if (error || !data) return null;
  
  // Verifica se o cache expirou
  const cacheTime = new Date(data.created_at).getTime();
  const now = new Date().getTime();
  const cacheAgeHours = (now - cacheTime) / (1000 * 60 * 60);
  
  if (cacheAgeHours > CACHE_EXPIRY_HOURS) return null;
  
  return data.value;
}

// Função para salvar resultado em cache
async function setCachedResult(cacheKey: string, result: any) {
  const { error } = await supabase
    .from(CACHE_TABLE)
    .upsert({
      key: cacheKey,
      value: result,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });
  
  if (error) {
    console.error('Erro ao salvar em cache:', error);
    // Registrar erro no log
    await logError('cache_error', `Erro ao salvar em cache: ${error.message}`, 'funnel-optimizer');
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
  try {
    const estimatedCost = calculateCost(modelName, tokensInput, tokensOutput);
    
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
      
    // Atualizar métricas globais
    await updateGlobalMetrics('funnel_analysis_usage', 1);
    await updateGlobalMetrics('tokens_processed', tokensInput + tokensOutput);
    
  } catch (error) {
    console.error('Erro ao registrar uso de IA:', error);
    await logError('usage_tracking_error', `Erro ao registrar uso de IA: ${error.message}`, 'funnel-optimizer');
  }
}

// Função para calcular custo estimado
function calculateCost(modelName: string, tokensInput: number, tokensOutput: number): number {
  // Valores padrão caso não encontre o modelo específico
  let inputCost = 0.0000010; // $0.0010 por 1K tokens
  let outputCost = 0.0000020; // $0.0020 por 1K tokens
  
  // Preços específicos por modelo (simplificado)
  const modelPrices: Record<string, {input: number, output: number}> = {
    'gpt-4o': { input: 0.0000050, output: 0.0000150 },
    'gpt-4': { input: 0.0000100, output: 0.0000300 },
    'gpt-3.5-turbo': { input: 0.0000010, output: 0.0000020 },
    'claude-3-5-sonnet': { input: 0.0000030, output: 0.0000150 },
    'claude-3-opus': { input: 0.0000150, output: 0.0000700 },
    'claude-3-haiku': { input: 0.0000025, output: 0.0000125 }
  };
  
  // Buscar preços específicos do modelo
  if (modelName && modelPrices[modelName]) {
    inputCost = modelPrices[modelName].input;
    outputCost = modelPrices[modelName].output;
  }
  
  // Calcular custo total
  const totalCost = (tokensInput * inputCost) + (tokensOutput * outputCost);
  return parseFloat(totalCost.toFixed(6));
}

// Função para atualizar métricas globais
async function updateGlobalMetrics(metricType: string, value: number) {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Verificar se já existe um registro para hoje
    const { data: existingMetric } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('metric_type', metricType)
      .eq('date', today)
      .maybeSingle();
    
    if (existingMetric) {
      // Atualizar registro existente
      await supabase
        .from('usage_metrics')
        .update({ 
          metric_value: existingMetric.metric_value + value 
        })
        .eq('id', existingMetric.id);
    } else {
      // Criar novo registro
      await supabase
        .from('usage_metrics')
        .insert({
          metric_type: metricType,
          metric_value: value,
          date: today
        });
    }
  } catch (error) {
    console.error('Erro ao atualizar métricas globais:', error);
  }
}

// Função para registrar erros
async function logError(errorType: string, errorMessage: string, endpoint: string) {
  try {
    // Verificar se já existe um erro similar
    const { data: existingError } = await supabase
      .from('error_logs')
      .select('*')
      .eq('error_type', errorType)
      .eq('error_message', errorMessage)
      .maybeSingle();
    
    if (existingError) {
      // Atualizar contagem e timestamp do erro existente
      await supabase
        .from('error_logs')
        .update({ 
          frequency: (existingError.frequency || 1) + 1,
          last_occurrence: new Date().toISOString()
        })
        .eq('id', existingError.id);
    } else {
      // Registrar novo erro
      await supabase
        .from('error_logs')
        .insert({
          error_type: errorType,
          error_message: errorMessage,
          endpoint: endpoint,
          first_occurrence: new Date().toISOString(),
          last_occurrence: new Date().toISOString(),
          frequency: 1,
          resolved: false
        });
    }
  } catch (error) {
    console.error('Erro ao registrar erro no log:', error);
  }
}

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
    return !!planFeatures.funnel_analysis || 
           !!planFeatures.premium_features || 
           planFeatures.plan_tier === 'premium';
    
  } catch (error) {
    console.error('Erro ao verificar acesso ao recurso:', error);
    await logError('access_check_error', `Erro ao verificar acesso: ${error.message}`, 'funnel-optimizer');
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
    
    // Registrar evento global
    await supabase.functions.invoke('track-usage', {
      body: { 
        feature_type: feature,
        user_id: userId
      }
    });
    
  } catch (error) {
    console.error('Erro ao incrementar uso do recurso:', error);
    await logError('usage_increment_error', `Erro ao incrementar uso: ${error.message}`, 'funnel-optimizer');
  }
}

// Função para chamar a API do provedor de IA
async function callAIProvider(prompt: string, aiConfig: any) {
  try {
    const modelName = aiConfig.model?.name || 'gpt-4o';
    const provider = aiConfig.model?.provider || 'openai';
    
    // Obter configuração do provedor
    const { data: providerConfig } = await supabase
      .from('provider_configurations')
      .select('*')
      .eq('provider_name', provider)
      .eq('is_active', true)
      .single();
    
    if (!providerConfig) {
      throw new Error(`Provedor ${provider} não configurado ou inativo`);
    }
    
    // Parâmetros para a chamada da API
    const apiParams = {
      model: modelName,
      messages: [
        { role: "system", content: aiConfig.system_prompt || "Você é um assistente especializado em marketing e otimização de funis." },
        { role: "user", content: prompt }
      ],
      temperature: aiConfig.temperature || 0.7,
      max_tokens: aiConfig.max_tokens || 2048,
      top_p: aiConfig.top_p || 0.9,
      frequency_penalty: aiConfig.frequency_penalty || 0,
      presence_penalty: aiConfig.presence_penalty || 0
    };
    
    // Configuração da API
    const apiEndpoint = providerConfig.api_endpoint || 'https://api.openai.com/v1/chat/completions';
    const apiKey = providerConfig.configuration?.api_key || '';
    
    if (!apiKey) {
      throw new Error(`Chave de API não configurada para o provedor ${provider}`);
    }
    
    // Chamada à API
    const startTime = Date.now();
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(apiParams)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    // Extrair e processar a resposta
    const content = data.choices[0]?.message?.content || '';
    
    // Tentar extrair o JSON da resposta
    try {
      // Remover possíveis marcações de código que a IA possa incluir
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      return {
        result: JSON.parse(jsonContent),
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || prompt.length / 4,
          completion_tokens: data.usage?.completion_tokens || content.length / 4,
          responseTime
        }
      };
    } catch (parseError) {
      console.error('Erro ao analisar resposta JSON:', parseError);
      throw new Error('A resposta da IA não está no formato JSON esperado');
    }
    
  } catch (error) {
    console.error('Erro ao chamar provedor de IA:', error);
    await logError('ai_provider_error', `Erro ao chamar IA: ${error.message}`, 'funnel-optimizer');
    throw error;
  }
}

// Função principal para processar a requisição
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
      
      // Registrar uso do cache nas métricas
      await updateGlobalMetrics('cache_hits', 1);
      
      return new Response(
        JSON.stringify(cachedResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar cache miss
    await updateGlobalMetrics('cache_misses', 1);

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

    try {
      // Chamar a API do provedor de IA
      const { result, usage } = await callAIProvider(prompt, aiConfig);
      
      // Registrar uso de IA
      await trackAIUsage(
        user.id,
        aiConfig.model?.name || "modelo-padrão",
        usage.prompt_tokens,
        usage.completion_tokens,
        usage.responseTime,
        true
      );
      
      // Incrementar contador de uso
      await incrementFeatureUsage(user.id, 'funnel_analysis');
      
      // Salvar em cache
      await setCachedResult(cacheKey, result);
      
      // Retornar resultado
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (aiError) {
      console.error('Erro ao processar com IA:', aiError);
      
      // Registrar erro
      await logError('ai_processing_error', aiError.message, 'funnel-optimizer');
      
      // Registrar uso com falha
      await trackAIUsage(
        user.id,
        aiConfig.model?.name || "modelo-padrão",
        prompt.length / 4, // Estimativa simplificada
        0,
        0,
        false
      );
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar a análise. Por favor, tente novamente mais tarde.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Erro ao processar análise de funil:', error);
    
    // Registrar erro geral
    await logError('general_error', error.message, 'funnel-optimizer');
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar a solicitação. Por favor, tente novamente mais tarde.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});