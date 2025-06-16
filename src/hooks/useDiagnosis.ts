import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth";
import { diagnosisService, DiagnosisReport } from "@/services/diagnosisService";

export const useDiagnosis = () => {
  const [adText, setAdText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisReport | null>(null);
  const [optimizedAds, setOptimizedAds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [usageLimits, setUsageLimits] = useState<{canUse: boolean, currentUsage: number, limit: number} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificar limites de uso ao inicializar
  useEffect(() => {
    if (user) {
      checkUsageLimits();
    }
  }, [user]);

  const checkUsageLimits = async () => {
    if (!user) return;
    
    try {
      const limits = await diagnosisService.checkUsageLimits(user.id);
      setUsageLimits(limits);
      
      // Notificar usuário se estiver próximo do limite
      if (limits.limit > 0 && limits.currentUsage >= limits.limit * 0.8) {
        toast({
          title: "Limite de uso próximo",
          description: `Você já utilizou ${limits.currentUsage} de ${limits.limit} diagnósticos disponíveis em seu plano.`,
          variant: "default",
        });
      }
      
      return limits;
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return null;
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      toast({
        title: "Acesso não autorizado",
        description: "Você precisa estar logado para analisar anúncios.",
        variant: "destructive",
      });
      return;
    }
    
    if (!adText.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Por favor, insira o texto do anúncio para análise.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar limites de uso
    const limits = await checkUsageLimits();
    if (limits && !limits.canUse) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de diagnósticos do seu plano. Faça upgrade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const report = await diagnosisService.analyzeAd({
        adText,
        userId: user.id
      });
      
      if (report) {
        setDiagnosisReport(report);
        
        // Incrementar contador de uso
        await diagnosisService.incrementUsageCounter(user.id);
        
        // Atualizar limites após o uso
        checkUsageLimits();
        
        toast({
          title: "Análise concluída!",
          description: "Seu anúncio foi analisado com sucesso.",
        });
      } else {
        throw new Error("Falha ao analisar anúncio");
      }
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
    if (!user || !diagnosisReport) return;
    
    setIsOptimizing(true);

    try {
      const result = await diagnosisService.optimizeAd(
        { adText, userId: user.id },
        diagnosisReport
      );
      
      if (result.success) {
        setOptimizedAds(result.optimizedAds);
        
        toast({
          title: "Otimização concluída!",
          description: `${result.optimizedAds.length} versões otimizadas foram geradas.`,
        });
      } else {
        throw new Error(result.error || "Falha ao otimizar anúncio");
      }
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
    handleOptimize,
    usageLimits,
    checkUsageLimits
  };
};