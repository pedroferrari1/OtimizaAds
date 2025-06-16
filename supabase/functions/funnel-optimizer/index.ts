/*
  Edge Function para análise de otimização de funil
  
  Analisa a coerência entre anúncios e páginas de destino,
  fornecendo diagnósticos e sugestões de melhoria utilizando IA.
  
  Implementa:
  - Integração com provedores de IA (OpenAI, Anthropic, etc.)
  - Sistema de cache para reduzir custos e melhorar performance
  - Verificação de limites de uso baseado no plano do usuário
  - Registro de métricas e logs de utilização
*/

import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHash } from 'npm:crypto';

// Configuração de CORS para a Edge Function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Interfaces de requisição e resposta
interface FunnelAnalysisRequest {
  adText: string;
  landingPageText: string;
}

interface FunnelAnalysisResult {
  funnelCoherenceScore: number;
  adDiagnosis: string;
  landingPageDiagnosis: string;
  syncSuggestions: string[];
  optimizedAd: string;
}

// Configuração da IA por provedor
interface AIConfig {
  model_name: string;
  provider: string;
  api_endpoint: string | null;
  provider_model_id: string;
  temperature: number;
  max_tokens: number;
  api_key: string;
}

// Interface para cache
interface CacheItem {
  key: string;
  value: FunnelAnalysisResult;
  created_at: string;
  expires_at: string;
}

Deno.serve(async (req) => {
  // Tratamento de requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter usuário a partir do token de autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header é obrigatório');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Autenticação inválida');
    }

    // Extrair dados do corpo da requisição
    const { adText, landingPageText }: FunnelAnalysisRequest = await req.json();

    // Validar dados de entrada
    if (!adText?.trim() || !landingPageText?.trim()) {
      throw new Error('Texto do anúncio e da página de destino são obrigatórios');
    }

    // Verificar se o usuário pode usar este recurso
    const { data: usageCheck, error: usageError } = await supabaseClient.rpc(
      'check_funnel_analysis_usage',
      { user_uuid: user.id }
    );

    if (usageError) {
      console.error('Erro ao verificar uso:', usageError);
      throw new Error('Erro ao verificar limite de uso');
    }

    if (!usageCheck?.[0]?.can_use) {
      throw new Error('Seu plano atual não inclui acesso ao Laboratório de Otimização de Funil');
    }

    // Marcar início da análise para métricas de performance
    const startTime = Date.now();

    // Gerar chave de cache com hash dos textos combinados
    const cacheKey = generateCacheKey(adText, landingPageText);

    // Verificar se há resultado em cache
    const cachedResult = await getCachedResult(supabaseClient, cacheKey);
    let analysisResult: FunnelAnalysisResult;
    let cacheHit = false;

    if (cachedResult) {
      // Usar resultado do cache
      analysisResult = cachedResult;
      cacheHit = true;
      console.log('Cache hit for analysis');

      // Registrar uso de cache para métricas
      await incrementCacheMetric(supabaseClient, 'cache_hits');
    } else {
      // Registrar cache miss para métricas
      await incrementCacheMetric(supabaseClient, 'cache_misses');
      
      // Obter configuração de IA
      const aiConfig = await getAIConfiguration(supabaseClient, user.id);
      if (!aiConfig) {
        throw new Error('Configuração de IA não encontrada');
      }

      // Realizar análise com IA
      analysisResult = await callAIProvider(aiConfig, adText, landingPageText);

      // Armazenar resultado em cache
      await cacheResult(supabaseClient, cacheKey, analysisResult);
    }

    // Calcular tempo de processamento
    const processingTime = Date.now() - startTime;

    // Registrar a análise no log
    const { error: logError } = await supabaseClient
      .from('funnel_analysis_logs')
      .insert({
        user_id: user.id,
        ad_text: adText,
        landing_page_text: landingPageText,
        coherence_score: analysisResult.funnelCoherenceScore,
        suggestions: analysisResult.syncSuggestions,
        optimized_ad: analysisResult.optimizedAd,
        processing_time_ms: processingTime
      });

    if (logError) {
      console.error('Erro ao registrar análise:', logError);
    }

    // Se não for cache hit, incrementar contador de uso
    if (!cacheHit) {
      await incrementUsageCounter(supabaseClient, user.id);

      // Registrar métricas de uso da IA
      const tokensInput = (adText.length + landingPageText.length) / 4; // Estimativa aproximada
      const tokensOutput = JSON.stringify(analysisResult).length / 4; // Estimativa aproximada
      
      await supabaseClient
        .from('ai_usage_metrics')
        .insert({
          user_id: user.id,
          model_name: aiConfig?.model_name || 'default',
          service_type: 'funnel_analysis',
          tokens_input: Math.round(tokensInput),
          tokens_output: Math.round(tokensOutput),
          estimated_cost: calculateCost(tokensInput, tokensOutput, aiConfig),
          response_time_ms: processingTime,
          success: true
        });
    }

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Erro na função funnel-optimizer:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

// Função para incrementar contador de uso da funcionalidade
async function incrementUsageCounter(supabaseClient, userId: string): Promise<void> {
  try {
    await supabaseClient.rpc('increment_usage_counter', {
      p_user_uuid: userId,
      p_feature_type: 'funnel_analysis'
    });
  } catch (error) {
    console.error('Erro ao incrementar contador de uso:', error);
  }
}

// Função para incrementar métricas de cache
async function incrementCacheMetric(supabaseClient, metricType: 'cache_hits' | 'cache_misses'): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await supabaseClient
      .from('usage_metrics')
      .upsert({
        metric_type: metricType,
        metric_value: 1,
        date: today
      }, {
        onConflict: 'metric_type,date',
        update: {
          metric_value: sql => `metric_value + 1`
        }
      });
  } catch (error) {
    console.error(`Erro ao incrementar métrica ${metricType}:`, error);
  }
}

// Função para gerar chave de cache
function generateCacheKey(adText: string, landingPageText: string): string {
  // Normalizar textos: remover espaços extras, converter para minúsculas
  const normalizedAdText = adText.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedLandingPageText = landingPageText.trim().toLowerCase().replace(/\s+/g, ' ');
  
  // Criar hash dos textos combinados
  const hash = createHash('sha256');
  hash.update(`${normalizedAdText}:${normalizedLandingPageText}`);
  return `funnel_analysis:${hash.digest('hex')}`;
}

// Função para obter resultado em cache
async function getCachedResult(supabaseClient, cacheKey: string): Promise<FunnelAnalysisResult | null> {
  try {
    const { data, error } = await supabaseClient
      .from('system_cache')
      .select('value')
      .eq('key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (error || !data) {
      return null;
    }
    
    return data.value as FunnelAnalysisResult;
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    return null;
  }
}

// Função para armazenar resultado em cache
async function cacheResult(supabaseClient, cacheKey: string, result: FunnelAnalysisResult): Promise<void> {
  try {
    // Calcular timestamp de expiração (24 horas por padrão)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await supabaseClient
      .from('system_cache')
      .upsert({
        key: cacheKey,
        value: result,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'key'
      });
  } catch (error) {
    console.error('Erro ao salvar em cache:', error);
  }
}

// Função para obter configuração de IA adequada para o usuário
async function getAIConfiguration(supabaseClient, userId: string): Promise<AIConfig | null> {
  try {
    // Tentar obter configuração específica para o serviço 'funnel_analysis'
    const { data: serviceConfig } = await supabaseClient
      .from('ai_configurations')
      .select(`
        id, 
        system_prompt, 
        temperature, 
        max_tokens,
        ai_models:model_id (
          id,
          model_name,
          provider,
          provider_model_id,
          api_endpoint
        )
      `)
      .eq('config_level', 'service')
      .eq('level_identifier', 'funnel_analysis')
      .eq('is_active', true)
      .single();
    
    if (serviceConfig?.ai_models) {
      // Obter chave de API para o provedor
      const apiKey = await getProviderAPIKey(supabaseClient, serviceConfig.ai_models.provider);
      
      return {
        model_name: serviceConfig.ai_models.model_name,
        provider: serviceConfig.ai_models.provider,
        api_endpoint: serviceConfig.ai_models.api_endpoint,
        provider_model_id: serviceConfig.ai_models.provider_model_id,
        temperature: serviceConfig.temperature || 0.7,
        max_tokens: serviceConfig.max_tokens || 2048,
        api_key: apiKey
      };
    }
    
    // Se não encontrar configuração específica, buscar configuração global
    const { data: globalConfig } = await supabaseClient
      .from('ai_configurations')
      .select(`
        id, 
        system_prompt, 
        temperature, 
        max_tokens,
        ai_models:model_id (
          id,
          model_name,
          provider,
          provider_model_id,
          api_endpoint
        )
      `)
      .eq('config_level', 'global')
      .eq('is_active', true)
      .single();
    
    if (globalConfig?.ai_models) {
      // Obter chave de API para o provedor
      const apiKey = await getProviderAPIKey(supabaseClient, globalConfig.ai_models.provider);
      
      return {
        model_name: globalConfig.ai_models.model_name,
        provider: globalConfig.ai_models.provider,
        api_endpoint: globalConfig.ai_models.api_endpoint,
        provider_model_id: globalConfig.ai_models.provider_model_id,
        temperature: globalConfig.temperature || 0.7,
        max_tokens: globalConfig.max_tokens || 2048,
        api_key: apiKey
      };
    }
    
    // Se não encontrar nenhuma configuração, usar valores padrão
    return {
      model_name: 'gpt-4o',
      provider: 'openai',
      api_endpoint: null,
      provider_model_id: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2048,
      api_key: Deno.env.get('OPENAI_API_KEY') || ''
    };
    
  } catch (error) {
    console.error('Erro ao buscar configuração de IA:', error);
    
    // Configuração de fallback
    return {
      model_name: 'gpt-4o',
      provider: 'openai',
      api_endpoint: null,
      provider_model_id: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2048,
      api_key: Deno.env.get('OPENAI_API_KEY') || ''
    };
  }
}

// Função para obter a chave de API de um provedor
async function getProviderAPIKey(supabaseClient, provider: string): Promise<string> {
  try {
    const providerEnvMapping = {
      'openai': 'OPENAI_API_KEY',
      'anthropic': 'ANTHROPIC_API_KEY',
      'novita': 'NOVITA_API_KEY',
      'google': 'GOOGLE_API_KEY',
      'deepseek': 'DEEPSEEK_API_KEY'
    };
    
    // Primeiro, tentar obter da configuração
    const { data: providerConfig } = await supabaseClient
      .from('provider_configurations')
      .select('configuration')
      .eq('provider_name', provider)
      .eq('is_active', true)
      .single();
    
    if (providerConfig?.configuration?.api_key && 
        providerConfig.configuration.api_key !== '***CONFIGURED***') {
      return providerConfig.configuration.api_key;
    }
    
    // Se não encontrar ou a chave for apenas um placeholder, usar variável de ambiente
    const envKey = providerEnvMapping[provider];
    if (envKey) {
      const apiKey = Deno.env.get(envKey);
      if (apiKey) {
        return apiKey;
      }
    }
    
    throw new Error(`API key não encontrada para o provedor ${provider}`);
  } catch (error) {
    console.error('Erro ao obter chave de API:', error);
    throw error;
  }
}

// Função para chamar o provedor de IA adequado
async function callAIProvider(config: AIConfig, adText: string, landingPageText: string): Promise<FunnelAnalysisResult> {
  // Construir o prompt para a IA
  const prompt = buildAIPrompt(adText, landingPageText);
  
  try {
    switch (config.provider) {
      case 'openai':
        return await callOpenAI(config, prompt);
      case 'anthropic':
        return await callAnthropic(config, prompt);
      case 'novita':
        return await callNovita(config, prompt);
      default:
        return await callOpenAI(config, prompt); // Fallback para OpenAI
    }
  } catch (error) {
    console.error(`Erro ao chamar provedor ${config.provider}:`, error);
    
    // Se falhar a chamada à IA, retornar um resultado simulado como fallback
    return fallbackAnalysisResult(adText, landingPageText);
  }
}

// Função para construir o prompt para a IA
function buildAIPrompt(adText: string, landingPageText: string): string {
  return `
Você é um especialista em marketing de performance e otimização de funis de conversão (CRO). 
Sua tarefa é analisar a coerência entre o texto de um anúncio e o texto de uma página de destino.

Analise os dois textos abaixo:

--- TEXTO DO ANÚNCIO ---
${adText.trim()}
--- FIM DO TEXTO DO ANÚNCIO ---

--- TEXTO DA PÁGINA DE DESTINO ---
${landingPageText.trim()}
--- FIM DO TEXTO DA PÁGINA DE DESTINO ---

Considerando os textos acima, avalie a coerência entre eles. Verifique se a promessa feita no anúncio é cumprida na página de destino, se a linguagem e o tom são consistentes, e se as palavras-chave importantes são mantidas.

Com base na sua análise, retorne um objeto JSON com a seguinte estrutura e nada mais:
{
  "funnelCoherenceScore": <um número de 0 a 10 representando a coerência entre os dois textos>,
  "adDiagnosis": "<uma análise concisa dos pontos fortes e fracos do anúncio>",
  "landingPageDiagnosis": "<uma análise concisa dos pontos fortes e fracos da página>",
  "syncSuggestions": ["<sugestão acionável 1 para melhorar a sincronia>", "<sugestão acionável 2>", "<sugestão acionável 3>", "<sugestão acionável 4>", "<sugestão acionável 5>"],
  "optimizedAd": "<uma nova versão do texto do anúncio, reescrita para ser perfeitamente coerente com a página de destino>"
}

Mantenha cada sugestão curta e acionável. O anúncio otimizado deve seguir as melhores práticas de marketing digital e ter aproximadamente o mesmo tamanho do anúncio original.
`;
}

// Função para chamar a API da OpenAI
async function callOpenAI(config: AIConfig, prompt: string): Promise<FunnelAnalysisResult> {
  const endpoint = config.api_endpoint || 'https://api.openai.com/v1/chat/completions';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`
    },
    body: JSON.stringify({
      model: config.provider_model_id,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing digital e otimização de funis de conversão.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro OpenAI (${response.status}): ${errorData}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extrair JSON da resposta
  try {
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}') + 1;
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      const jsonContent = content.substring(jsonStartIndex, jsonEndIndex);
      return JSON.parse(jsonContent);
    } else {
      throw new Error('Não foi possível extrair JSON da resposta');
    }
  } catch (e) {
    console.error('Erro ao processar resposta JSON:', e);
    throw new Error('Formato de resposta inválido da OpenAI');
  }
}

// Função para chamar a API da Anthropic
async function callAnthropic(config: AIConfig, prompt: string): Promise<FunnelAnalysisResult> {
  const endpoint = config.api_endpoint || 'https://api.anthropic.com/v1/messages';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.api_key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.provider_model_id,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro Anthropic (${response.status}): ${errorData}`);
  }
  
  const data = await response.json();
  const content = data.content[0].text;
  
  // Extrair JSON da resposta
  try {
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}') + 1;
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      const jsonContent = content.substring(jsonStartIndex, jsonEndIndex);
      return JSON.parse(jsonContent);
    } else {
      throw new Error('Não foi possível extrair JSON da resposta');
    }
  } catch (e) {
    console.error('Erro ao processar resposta JSON:', e);
    throw new Error('Formato de resposta inválido da Anthropic');
  }
}

// Função para chamar a API da Novita
async function callNovita(config: AIConfig, prompt: string): Promise<FunnelAnalysisResult> {
  const endpoint = config.api_endpoint || 'https://api.novita.ai/v1/chat/completions';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.api_key}`
    },
    body: JSON.stringify({
      model: config.provider_model_id,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing digital e otimização de funis de conversão.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Erro Novita (${response.status}): ${errorData}`);
  }
  
  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extrair JSON da resposta
  try {
    const jsonStartIndex = content.indexOf('{');
    const jsonEndIndex = content.lastIndexOf('}') + 1;
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      const jsonContent = content.substring(jsonStartIndex, jsonEndIndex);
      return JSON.parse(jsonContent);
    } else {
      throw new Error('Não foi possível extrair JSON da resposta');
    }
  } catch (e) {
    console.error('Erro ao processar resposta JSON:', e);
    throw new Error('Formato de resposta inválido da Novita');
  }
}

// Função para calcular custo estimado da chamada
function calculateCost(tokensInput: number, tokensOutput: number, config: AIConfig): number {
  const baseCost = 0.0001; // Custo base baixo para fallback
  
  // Se não tivermos configuração, usar estimativa simples
  if (!config) {
    return (tokensInput + tokensOutput) * baseCost;
  }
  
  // Custos aproximados por provedor/modelo
  switch (config.model_name.toLowerCase()) {
    case 'gpt-4':
    case 'gpt-4o':
      return (tokensInput * 0.00001) + (tokensOutput * 0.00003);
    case 'gpt-3.5-turbo':
      return (tokensInput * 0.000001) + (tokensOutput * 0.000002);
    case 'claude-3-5-sonnet':
      return (tokensInput * 0.00000315) + (tokensOutput * 0.0000095);
    case 'claude-3-haiku':
      return (tokensInput * 0.00000025) + (tokensOutput * 0.00000125);
    case 'claude-3-opus':
      return (tokensInput * 0.00001) + (tokensOutput * 0.00003);
    default:
      return (tokensInput + tokensOutput) * baseCost;
  }
}

// Função para análise de fallback em caso de erro na IA
function fallbackAnalysisResult(adText: string, landingPageText: string): FunnelAnalysisResult {
  console.log("Usando análise de fallback");
  
  // Calcular pontuação de coerência baseada em sobreposição de palavras
  const adWords = adText.toLowerCase().split(/\s+/);
  const landingWords = landingPageText.toLowerCase().split(/\s+/);
  
  const commonWords = adWords.filter(word => 
    landingWords.includes(word) && word.length > 3
  );
  
  const coherenceScore = Math.min(7.5, Math.max(3, 
    (commonWords.length / Math.min(adWords.length, 50)) * 10
  ));

  return {
    funnelCoherenceScore: coherenceScore,
    adDiagnosis: "Análise de fallback: O anúncio contém elementos que precisam ser melhor alinhados com a página de destino para maximizar conversões.",
    landingPageDiagnosis: "Análise de fallback: A página de destino deve reforçar as promessas feitas no anúncio e manter consistência de mensagem.",
    syncSuggestions: [
      "Alinhe as palavras-chave principais entre anúncio e página de destino",
      "Mantenha a mesma proposta de valor em ambos os elementos",
      "Use linguagem consistente e tom de voz similar",
      "Garanta que a página cumpra a promessa do anúncio",
      "Inclua uma chamada para ação clara e proeminente"
    ],
    optimizedAd: `📢 ${adText.split(' ').slice(0, 3).join(' ')}... 

Descubra como nossa solução pode ajudar você! 
Resultados comprovados por clientes satisfeitos. 

✅ Solução completa
✅ Suporte dedicado
✅ Garantia de satisfação

👉 Clique agora e transforme seus resultados!`
  };
}