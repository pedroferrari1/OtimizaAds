import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Interface para os dados de entrada para geração de anúncios
 */
export interface AdGenerationInput {
  productName: string;
  productDescription: string;
  targetAudience: string;
  userId: string;
}

/**
 * Interface para os resultados da geração de anúncios
 */
export interface AdGenerationResult {
  ads: string[];
  success: boolean;
  error?: string;
}

/**
 * Serviço responsável pela geração de anúncios com IA
 */
export const adGenerationService = {
  /**
   * Gera anúncios com base nas informações do produto
   * @param input Dados de entrada para a geração de anúncios
   * @returns Resultado da geração contendo os anúncios gerados
   */
  async generateAds(input: AdGenerationInput): Promise<AdGenerationResult> {
    try {
      // TODO: Quando a integração com IA estiver pronta, substituir por chamada real
      // Simulação de chamada para API de IA
      console.log("Gerando anúncios para:", input);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resposta da IA
      const generatedAds = [
        `🔥 ${input.productName} está aqui! ${input.productDescription.substring(0, 50)}... Perfeito para ${input.targetAudience}. Não perca esta oportunidade! 👇`,
        `Você sabia que ${input.productName} pode transformar sua vida? ${input.productDescription.substring(0, 40)}... Ideal para ${input.targetAudience}. Clique e descubra!`,
        `Atenção ${input.targetAudience}! ${input.productName} é exatamente o que você precisa. ${input.productDescription.substring(0, 45)}... Garante já o seu!`,
        `${input.productName}: A solução que ${input.targetAudience} estava esperando! ${input.productDescription.substring(0, 50)}... Aproveite agora!`,
        `Revolucione sua experiência com ${input.productName}! ${input.productDescription.substring(0, 40)}... Desenvolvido especialmente para ${input.targetAudience}.`
      ];
      
      // Salvar no histórico do usuário
      await this.saveToHistory(input, generatedAds);
      
      return {
        ads: generatedAds,
        success: true
      };
    } catch (error) {
      console.error('Erro ao gerar anúncios:', error);
      return {
        ads: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar anúncios'
      };
    }
  },
  
  /**
   * Salva os anúncios gerados no histórico do usuário
   * @param input Dados de entrada usados na geração
   * @param generatedAds Anúncios gerados
   */
  async saveToHistory(input: AdGenerationInput, generatedAds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: input.userId,
          type: 'generation',
          title: `Anúncios para ${input.productName}`,
          content: generatedAds.join('\n\n---\n\n'),
          input_data: {
            productName: input.productName,
            productDescription: input.productDescription,
            targetAudience: input.targetAudience
          }
        });

      if (error) {
        console.error('Erro ao salvar no histórico:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar no histórico.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar no histórico:', error);
    }
  },
  
  /**
   * Verifica se o usuário pode usar a funcionalidade de geração de anúncios
   * baseado em seu plano de assinatura
   * @param userId ID do usuário
   * @returns Objeto contendo informações sobre o uso e limites
   */
  async checkUsageLimits(userId: string): Promise<{ canUse: boolean; currentUsage: number; limit: number }> {
    try {
      const { data, error } = await supabase.rpc('check_feature_usage', {
        user_uuid: userId,
        feature: 'generations'
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          canUse: data[0].can_use,
          currentUsage: data[0].current_usage,
          limit: data[0].limit_value
        };
      }
      
      // Padrão caso não encontre informações
      return { canUse: true, currentUsage: 0, limit: 5 };
    } catch (error) {
      console.error('Erro ao verificar limites de uso:', error);
      // Em caso de erro, permitir uso com valores padrão
      return { canUse: true, currentUsage: 0, limit: 5 };
    }
  },
  
  /**
   * Incrementa o contador de uso da funcionalidade de geração de anúncios
   * @param userId ID do usuário
   */
  async incrementUsageCounter(userId: string): Promise<void> {
    try {
      // Chamar a edge function que registra o uso
      await supabase.functions.invoke('track-usage', {
        body: { 
          feature_type: 'generations',
          user_id: userId
        }
      });
    } catch (error) {
      console.error('Erro ao incrementar contador de uso:', error);
    }
  }
};