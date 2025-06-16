import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth";
import { adGenerationService } from "@/services/adGenerationService";

export const useAdGenerator = () => {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [usageLimits, setUsageLimits] = useState<{canUse: boolean, currentUsage: number, limit: number} | null>(null);
  const { user } = useAuth();

  const checkUsageLimits = async () => {
    if (!user) return;
    
    try {
      const limits = await adGenerationService.checkUsageLimits(user.id);
      setUsageLimits(limits);
      
      // Notificar usuário se estiver próximo do limite
      if (limits.limit > 0 && limits.currentUsage >= limits.limit * 0.8) {
        toast({
          title: "Limite de uso próximo",
          description: `Você já utilizou ${limits.currentUsage} de ${limits.limit} gerações disponíveis em seu plano.`,
          variant: "default",
        });
      }
      
      return limits;
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return null;
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Acesso não autorizado",
        description: "Você precisa estar logado para gerar anúncios.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar limites de uso
    const limits = await checkUsageLimits();
    if (limits && !limits.canUse) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu o limite de gerações do seu plano. Faça upgrade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const result = await adGenerationService.generateAds({
        productName,
        productDescription,
        targetAudience,
        userId: user.id
      });
      
      if (result.success) {
        setGeneratedAds(result.ads);
        
        // Incrementar contador de uso
        await adGenerationService.incrementUsageCounter(user.id);
        
        // Atualizar limites após o uso
        checkUsageLimits();
        
        toast({
          title: "Anúncios gerados com sucesso!",
          description: `${result.ads.length} variações foram criadas para seu produto.`,
        });
      } else {
        throw new Error(result.error || "Falha ao gerar anúncios");
      }
    } catch (error) {
      toast({
        title: "Erro ao gerar anúncios",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Texto copiado!",
        description: "O anúncio foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  return {
    productName,
    setProductName,
    productDescription,
    setProductDescription,
    targetAudience,
    setTargetAudience,
    isGenerating,
    generatedAds,
    handleGenerate,
    copyToClipboard,
    copiedIndex,
    usageLimits,
    checkUsageLimits
  };
};