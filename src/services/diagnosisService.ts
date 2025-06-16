import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Interface para o relatório de diagnóstico de anúncios
 */
export interface DiagnosisReport {
  clarityScore: number;
  hookAnalysis: string;
  ctaAnalysis: string;
  mentalTriggers: string[];
  suggestions: string[];
}

/**
 * Interface para os dados de entrada do diagnóstico
 */
export interface DiagnosisInput {
  adText: string;
  userId: string;
}

/**
 * Interface para o resultado da otimização de anúncios
 */
export interface OptimizationResult {
  optimizedAds: string[];
  success: boolean;
  error?: string;
}

/**
 * Serviço responsável pelo diagnóstico e otimização de anúncios
 */
export const diagnosisService = {
  /**
   * Analisa um anúncio e gera um relatório de diagnóstico
   * @param input Texto do anúncio e ID do usuário
   * @returns Relatório de diagnóstico
   */
  async analyzeAd(input: DiagnosisInput): Promise<DiagnosisReport | null> {
    try {
      // TODO: Quando a integração com IA estiver pronta, substituir por chamada real
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular relatório de diagnóstico
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
      
      return mockReport;
    } catch (error) {
      console.error('Erro ao analisar anúncio:', error);
      return null;
    }
  },
  
  /**
   * Gera versões otimizadas de um anúncio com base no diagnóstico
   * @param input Texto do anúncio original e relatório de diagnóstico
   * @returns Versões otimizadas do anúncio
   */
  async optimizeAd(
    input: DiagnosisInput, 
    report: DiagnosisReport
  ): Promise<OptimizationResult> {
    try {
      // TODO: Quando a integração com IA estiver pronta, substituir por chamada real
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular anúncios otimizados
      const mockOptimizedAds = [
        "🚨 Você sabia que 87% das pessoas falham no marketing digital? Descubra o método exato que transformou mais de 1.000 empreendedores em especialistas. ⏰ Últimas 24h com desconto! Clique agora! 👇",
        "❓ Por que seus concorrentes vendem mais que você? A resposta está no nosso curso comprovado por + de 500 alunos. 🔥 Apenas hoje: 50% OFF! Garantir minha vaga →",
        "✅ Método aprovado por 1.000+ empreendedores está com vagas limitadas! Transforme seu negócio em 30 dias ou seu dinheiro de volta. ⚡ Restam apenas 12 vagas! Quero me inscrever!"
      ];
      
      // Salvar no histórico
      await this.saveToHistory(input, report, mockOptimizedAds);
      
      return {
        optimizedAds: mockOptimizedAds,
        success: true
      };
    } catch (error) {
      console.error('Erro ao otimizar anúncio:', error);
      return {
        optimizedAds: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao otimizar anúncio'
      };
    }
  },
  
  /**
   * Salva o diagnóstico e otimização no histórico do usuário
   */
  async saveToHistory(
    input: DiagnosisInput, 
    diagnosisReport: DiagnosisReport, 
    optimizedAds: string[]
  ): Promise<void> {
    try {
      const content = `TEXTO ORIGINAL:\n${input.adText}\n\n---\n\nRELATÓRIO DE DIAGNÓSTICO:\n${JSON.stringify(diagnosisReport, null, 2)}\n\n---\n\nVERSÕES OTIMIZADAS:\n${optimizedAds.join('\n\n')}`;
      
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: input.userId,
          type: 'diagnosis',
          title: `Diagnóstico: ${input.adText.substring(0, 50)}...`,
          content: content,
          input_data: {
            originalText: input.adText,
            diagnosisReport,
            optimizedAds
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
   * Verifica se o usuário pode usar a funcionalidade de diagnóstico
   * baseado em seu plano de assinatura
   * @param userId ID do usuário
   * @returns Objeto contendo informações sobre o uso e limites
   */
  async checkUsageLimits(userId: string): Promise<{ canUse: boolean; currentUsage: number; limit: number }> {
    try {
      const { data, error } = await supabase.rpc('check_feature_usage', {
        user_uuid: userId,
        feature: 'diagnostics'
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
      return { canUse: true, currentUsage: 0, limit: 3 };
    } catch (error) {
      console.error('Erro ao verificar limites de uso:', error);
      // Em caso de erro, permitir uso com valores padrão
      return { canUse: true, currentUsage: 0, limit: 3 };
    }
  },
  
  /**
   * Incrementa o contador de uso da funcionalidade de diagnóstico
   * @param userId ID do usuário
   */
  async incrementUsageCounter(userId: string): Promise<void> {
    try {
      // Chamar a edge function que registra o uso
      await supabase.functions.invoke('track-usage', {
        body: { 
          feature_type: 'diagnostics',
          user_id: userId
        }
      });
    } catch (error) {
      console.error('Erro ao incrementar contador de uso:', error);
    }
  }
};