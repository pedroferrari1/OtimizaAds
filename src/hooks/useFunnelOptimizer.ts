import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { FunnelAnalysisResult } from "@/types/funnel-optimizer";

export const useFunnelOptimizer = () => {
  const [adText, setAdText] = useState<string>("");
  const [landingPageText, setLandingPageText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<FunnelAnalysisResult | null>(null);
  const [canUseFeature, setCanUseFeature] = useState<boolean>(true);
  const [usageData, setUsageData] = useState<{current: number, limit: number} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificar se o usuário pode usar o recurso
  useEffect(() => {
    if (user) {
      checkFeatureUsage();
    }
  }, [user]);

  const checkFeatureUsage = async () => {
    try {
      const { data, error } = await supabase.rpc('check_funnel_analysis_usage', {
        user_uuid: user?.id
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const usage = data[0];
        setCanUseFeature(usage.can_use);
        setUsageData({
          current: usage.current_usage,
          limit: usage.limit_value
        });
        
        // Avisar se estiver próximo do limite
        if (usage.limit_value > 0 && usage.current_usage >= usage.limit_value * 0.8) {
          toast({
            title: "Atenção",
            description: `Você utilizou ${usage.current_usage} de ${usage.limit_value} análises disponíveis em seu plano.`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar uso do recurso:', error);
    }
  };

  const saveToHistory = async (
    adText: string, 
    landingPageText: string, 
    results: FunnelAnalysisResult
  ) => {
    if (!user) return;

    try {
      const content = `
TEXTO DO ANÚNCIO:
${adText}

TEXTO DA PÁGINA DE DESTINO:
${landingPageText}

ANÁLISE DE COERÊNCIA:
Pontuação: ${results.funnelCoherenceScore}/10

DIAGNÓSTICO DO ANÚNCIO:
${results.adDiagnosis}

DIAGNÓSTICO DA PÁGINA DE DESTINO:
${results.landingPageDiagnosis}

SUGESTÕES DE MELHORIA:
${results.syncSuggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}

ANÚNCIO OTIMIZADO:
${results.optimizedAd}
`;
      
      const inputData = {
        adText,
        landingPageText,
        results
      };
      
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: user.id,
          type: 'funnel_analysis',
          title: `Análise de Funil: ${adText.substring(0, 30)}...`,
          content: content,
          input_data: inputData
        });

      if (error) {
        console.error('Error saving to history:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar no histórico.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Salvo no histórico!",
          description: "A análise foi salva no seu histórico.",
        });
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!adText.trim() || !landingPageText.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o texto do anúncio e da página de destino.",
        variant: "destructive",
      });
      return;
    }

    if (!canUseFeature) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de análises do seu plano. Faça upgrade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Chamar a Edge Function
      const { data, error } = await supabase.functions.invoke('funnel-optimizer', {
        body: { adText, landingPageText }
      });
      
      if (error) throw error;
      
      // Atualizar dados de uso após análise bem-sucedida
      await checkFeatureUsage();
      
      // Definir resultados
      setAnalysisResults(data);
      
      // Salvar no histórico
      await saveToHistory(adText, landingPageText, data);
      
    } catch (error: any) {
      console.error('Error analyzing funnel:', error);
      
      // Verificar se é um erro de limite de plano
      if (error.message?.includes('plano atual não inclui acesso')) {
        setCanUseFeature(false);
        toast({
          title: "Recurso não disponível",
          description: "Seu plano atual não inclui acesso ao Laboratório de Otimização de Funil. Faça upgrade para continuar.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro na análise",
          description: "Não foi possível analisar os textos. Tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetResults = () => {
    setAnalysisResults(null);
  };

  return {
    adText,
    setAdText,
    landingPageText,
    setLandingPageText,
    isAnalyzing,
    analysisResults,
    handleAnalyze,
    resetResults,
    canUseFeature,
    usageData
  };
};