/*
  Edge Function para análise de otimização de funil
  
  Analisa a coerência entre anúncios e páginas de destino,
  fornecendo diagnósticos e sugestões de melhoria.
*/

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FunnelAnalysisRequest {
  adText: string
  landingPageText: string
}

interface FunnelAnalysisResult {
  funnelCoherenceScore: number
  adDiagnosis: string
  landingPageDiagnosis: string
  syncSuggestions: string[]
  optimizedAd: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Parse request body
    const { adText, landingPageText }: FunnelAnalysisRequest = await req.json()

    if (!adText?.trim() || !landingPageText?.trim()) {
      throw new Error('Texto do anúncio e da página de destino são obrigatórios')
    }

    // Check if user can use this feature
    const { data: usageCheck, error: usageError } = await supabaseClient.rpc(
      'check_funnel_analysis_usage',
      { user_uuid: user.id }
    )

    if (usageError) {
      console.error('Error checking usage:', usageError)
      throw new Error('Erro ao verificar limite de uso')
    }

    if (!usageCheck?.[0]?.can_use) {
      throw new Error('Seu plano atual não inclui acesso ao Laboratório de Otimização de Funil')
    }

    const startTime = Date.now()

    // Simulate AI analysis (replace with actual AI service call)
    const analysisResult = await analyzeFineFunnel(adText, landingPageText)

    const processingTime = Date.now() - startTime

    // Log the analysis
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
      })

    if (logError) {
      console.error('Error logging analysis:', logError)
    }

    // Update usage tracking
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const { error: trackingError } = await supabaseClient
      .from('usage_tracking')
      .upsert({
        user_id: user.id,
        feature_type: 'funnel_analysis',
        count: 1,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString()
      }, {
        onConflict: 'user_id,feature_type,period_start',
        update: ['count', 'updated_at']
      })

    if (trackingError) {
      console.error('Error updating usage tracking:', trackingError)
    }

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in funnel-optimizer function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function analyzeFineFunnel(adText: string, landingPageText: string): Promise<FunnelAnalysisResult> {
  // Simulated AI analysis - replace with actual AI service integration
  
  // Calculate coherence score based on keyword overlap and messaging alignment
  const adWords = adText.toLowerCase().split(/\s+/)
  const landingWords = landingPageText.toLowerCase().split(/\s+/)
  
  const commonWords = adWords.filter(word => 
    landingWords.includes(word) && word.length > 3
  )
  
  const coherenceScore = Math.min(10, Math.max(1, 
    Math.round((commonWords.length / Math.max(adWords.length, landingWords.length)) * 10 + Math.random() * 2)
  ))

  // Generate diagnoses and suggestions
  const adDiagnosis = generateAdDiagnosis(adText, coherenceScore)
  const landingPageDiagnosis = generateLandingPageDiagnosis(landingPageText, coherenceScore)
  const syncSuggestions = generateSyncSuggestions(adText, landingPageText, coherenceScore)
  const optimizedAd = generateOptimizedAd(adText, landingPageText)

  return {
    funnelCoherenceScore: coherenceScore,
    adDiagnosis,
    landingPageDiagnosis,
    syncSuggestions,
    optimizedAd
  }
}

function generateAdDiagnosis(adText: string, score: number): string {
  if (score >= 8) {
    return `✅ Excelente! Seu anúncio está bem alinhado com a proposta de valor. As palavras-chave estão consistentes e a mensagem é clara e persuasiva.`
  } else if (score >= 6) {
    return `⚠️ Bom, mas pode melhorar. Seu anúncio tem uma base sólida, mas algumas palavras-chave importantes da página de destino poderiam ser melhor destacadas.`
  } else if (score >= 4) {
    return `🔄 Requer ajustes. Há uma desconexão entre o anúncio e a página de destino. Considere revisar as palavras-chave e a proposta de valor.`
  } else {
    return `❌ Crítico. O anúncio não está alinhado com a página de destino. É essencial reformular a mensagem para criar consistência.`
  }
}

function generateLandingPageDiagnosis(landingPageText: string, score: number): string {
  if (score >= 8) {
    return `✅ Excelente correspondência! A página de destino reforça perfeitamente a promessa do anúncio e mantém o visitante engajado.`
  } else if (score >= 6) {
    return `⚠️ Boa base. A página atende às expectativas criadas pelo anúncio, mas alguns elementos poderiam ser otimizados para melhor conversão.`
  } else if (score >= 4) {
    return `🔄 Necessita melhorias. A página não está cumprindo completamente a promessa do anúncio, criando possível frustração no visitante.`
  } else {
    return `❌ Desalinhamento crítico. A página de destino não corresponde às expectativas criadas pelo anúncio, resultando em alta taxa de rejeição.`
  }
}

function generateSyncSuggestions(adText: string, landingPageText: string, score: number): string[] {
  const suggestions: string[] = []

  if (score < 7) {
    suggestions.push("Alinhe as palavras-chave principais entre anúncio e página de destino")
    suggestions.push("Mantenha a mesma proposta de valor em ambos os elementos")
    suggestions.push("Use linguagem consistente e tom de voz similar")
  }

  if (score < 5) {
    suggestions.push("Revise o título da página para refletir a promessa do anúncio")
    suggestions.push("Adicione elementos visuais que reforcem a mensagem do anúncio")
    suggestions.push("Simplifique o processo de conversão mencionado no anúncio")
  }

  if (score < 3) {
    suggestions.push("Considere reformular completamente a página de destino")
    suggestions.push("Implemente testes A/B para validar diferentes abordagens")
    suggestions.push("Adicione prova social que sustente as afirmações do anúncio")
  }

  // Always add some general best practices
  suggestions.push("Otimize o tempo de carregamento da página")
  suggestions.push("Garanta que a página seja responsiva para dispositivos móveis")
  suggestions.push("Inclua uma chamada para ação clara e proeminente")

  return suggestions
}

function generateOptimizedAd(adText: string, landingPageText: string): string {
  // Extract key concepts from landing page
  const landingWords = landingPageText.toLowerCase().split(/\s+/)
  const keyPhrases = extractKeyPhrases(landingPageText)
  
  // Create an optimized version based on landing page content
  const optimizedAd = `🎯 ${keyPhrases[0] || 'Solução Completa'} | ✅ Resultados Garantidos
  
${keyPhrases[1] || 'Transforme seus resultados'} com nossa metodologia comprovada. 

${keyPhrases[2] || 'Milhares de clientes'} já obtiveram sucesso.

👉 Clique agora e descubra como!`

  return optimizedAd
}

function extractKeyPhrases(text: string): string[] {
  // Simple extraction - in a real implementation, use NLP
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
  return sentences.slice(0, 3).map(s => s.trim().substring(0, 50) + (s.length > 50 ? '...' : ''))
}