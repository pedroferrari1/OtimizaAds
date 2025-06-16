import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";

export const useAdGenerator = () => {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { user } = useAuth();

  const saveToHistory = async (inputData: any, generatedAds: string[]) => {
    if (!user) return;

    try {
      // Convert data to Json compatible format
      const jsonInputData = JSON.parse(JSON.stringify(inputData));
      
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: user.id,
          type: 'generation',
          title: `Anúncios para ${inputData.productName}`,
          content: generatedAds.join('\n\n---\n\n'),
          input_data: jsonInputData
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
          description: "Os anúncios foram salvos no seu histórico.",
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // TODO: Integrate with Novita.ai API via Supabase Edge Function
      console.log("Generating ads for:", { productName, productDescription, targetAudience });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated ads
      const mockAds = [
        `🔥 ${productName} está aqui! ${productDescription.substring(0, 50)}... Perfeito para ${targetAudience}. Não perca esta oportunidade! 👇`,
        `Você sabia que ${productName} pode transformar sua vida? ${productDescription.substring(0, 40)}... Ideal para ${targetAudience}. Clique e descubra!`,
        `Atenção ${targetAudience}! ${productName} é exatamente o que você precisa. ${productDescription.substring(0, 45)}... Garante já o seu!`,
        `${productName}: A solução que ${targetAudience} estava esperando! ${productDescription.substring(0, 50)}... Aproveite agora!`,
        `Revolucione sua experiência com ${productName}! ${productDescription.substring(0, 40)}... Desenvolvido especialmente para ${targetAudience}.`
      ];
      
      setGeneratedAds(mockAds);
      
      // Save to history
      const inputData = {
        productName,
        productDescription,
        targetAudience
      };
      await saveToHistory(inputData, mockAds);
      
      toast({
        title: "Anúncios gerados com sucesso!",
        description: "5 variações foram criadas para seu produto.",
      });
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
    copiedIndex
  };
};