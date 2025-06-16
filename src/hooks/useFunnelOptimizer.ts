import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { FunnelAnalysisResult } from "@/types/funnel-optimizer";

export const useFunnelOptimizer = () => {
  const [adText, setAdText] = useState<string>("");
  const [landingPageText, setLandingPageText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<FunnelAnalysisResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

    setIsAnalyzing(true);

    try {
      // Em uma implementação real, chamaríamos a Edge Function
      // const { data, error } = await supabase.functions.invoke('funnel-optimizer', {
      //   body: { adText, landingPageText }
      // });
      
      // if (error) throw error;
      // setAnalysisResults(data);
      
      // Simulação de resposta para desenvolvimento da UI
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResults: FunnelAnalysisResult = {
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
      
      setAnalysisResults(mockResults);
      
      // Salvar no histórico
      await saveToHistory(adText, landingPageText, mockResults);
      
    } catch (error) {
      console.error('Error analyzing funnel:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar os textos. Tente novamente mais tarde.",
        variant: "destructive",
      });
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
    resetResults
  };
};