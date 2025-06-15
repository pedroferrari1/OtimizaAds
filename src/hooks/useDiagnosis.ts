import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosisReport {
  clarityScore: number;
  hookAnalysis: string;
  ctaAnalysis: string;
  mentalTriggers: string[];
  suggestions: string[];
}

export const useDiagnosis = () => {
  const [adText, setAdText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisReport | null>(null);
  const [optimizedAds, setOptimizedAds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const saveToHistory = async (originalText: string, diagnosisReport: DiagnosisReport, optimizedAds: string[]) => {
    if (!user) return;

    try {
      const content = `TEXTO ORIGINAL:\n${originalText}\n\n---\n\nRELATÓRIO DE DIAGNÓSTICO:\n${JSON.stringify(diagnosisReport, null, 2)}\n\n---\n\nVERSÕES OTIMIZADAS:\n${optimizedAds.join('\n\n')}`;
      
      const inputData = JSON.parse(JSON.stringify({
        originalText,
        diagnosisReport,
        optimizedAds
      }));
      
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: user.id,
          type: 'diagnosis',
          title: `Diagnóstico: ${originalText.substring(0, 50)}...`,
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
          description: "O diagnóstico foi salvo no seu histórico.",
        });
      }
    } catch (error) {
      console.error('Error saving to history:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar no histórico.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!adText.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Por favor, insira o texto do anúncio para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      console.log("Analyzing ad:", adText);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock diagnosis report
      const mockReport: DiagnosisReport = {
        clarityScore: 7.5,
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
      
      setDiagnosisReport(mockReport);
      toast({
        title: "Análise concluída!",
        description: "Seu anúncio foi analisado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!diagnosisReport) return;
    
    setIsOptimizing(true);

    try {
      console.log("Optimizing ad based on diagnosis:", diagnosisReport);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimized ads
      const mockOptimizedAds = [
        "🚨 Você sabia que 87% das pessoas falham no marketing digital? Descubra o método exato que transformou mais de 1.000 empreendedores em especialistas. ⏰ Últimas 24h com desconto! Clique agora! 👇",
        "❓ Por que seus concorrentes vendem mais que você? A resposta está no nosso curso comprovado por + de 500 alunos. 🔥 Apenas hoje: 50% OFF! Garantir minha vaga →",
        "✅ Método aprovado por 1.000+ empreendedores está com vagas limitadas! Transforme seu negócio em 30 dias ou seu dinheiro de volta. ⚡ Restam apenas 12 vagas! Quero me inscrever!"
      ];
      
      setOptimizedAds(mockOptimizedAds);
      
      // Save to history
      await saveToHistory(adText, diagnosisReport, mockOptimizedAds);
      
      toast({
        title: "Otimização concluída!",
        description: "3 versões otimizadas foram geradas.",
      });
    } catch (error) {
      toast({
        title: "Erro na otimização",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    adText,
    setAdText,
    isAnalyzing,
    diagnosisReport,
    optimizedAds,
    isOptimizing,
    handleAnalyze,
    handleOptimize
  };
};
