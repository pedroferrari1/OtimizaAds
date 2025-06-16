import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para evento de analytics
 */
export interface AnalyticsEvent {
  /**
   * Categoria do evento
   */
  category: string;
  
  /**
   * Ação realizada
   */
  action: string;
  
  /**
   * Rótulo opcional
   */
  label?: string;
  
  /**
   * Valor numérico opcional
   */
  value?: number;
  
  /**
   * Propriedades adicionais
   */
  properties?: Record<string, any>;
}

/**
 * Serviço para registrar e analisar eventos de analytics
 */
export const analyticsService = {
  /**
   * Registra um evento de analytics
   * @param userId ID do usuário
   * @param event Dados do evento
   * @returns Sucesso da operação
   */
  async trackEvent(userId: string, event: AnalyticsEvent): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          category: event.category,
          action: event.action,
          label: event.label,
          value: event.value,
          properties: event.properties,
          timestamp: new Date().toISOString()
        });
        
      return !error;
    } catch (error) {
      console.error('Erro ao registrar evento de analytics:', error);
      return false;
    }
  },
  
  /**
   * Registra uma visualização de página
   * @param userId ID do usuário
   * @param path Caminho da página
   * @param title Título da página
   * @param referrer Referenciador
   * @returns Sucesso da operação
   */
  async trackPageView(userId: string, path: string, title: string, referrer?: string): Promise<boolean> {
    return this.trackEvent(userId, {
      category: 'page_view',
      action: 'view',
      label: title,
      properties: {
        path,
        title,
        referrer: referrer || document.referrer,
        url: window.location.href
      }
    });
  },
  
  /**
   * Registra um evento de conversão
   * @param userId ID do usuário
   * @param conversionType Tipo de conversão
   * @param value Valor da conversão
   * @param properties Propriedades adicionais
   * @returns Sucesso da operação
   */
  async trackConversion(userId: string, conversionType: string, value?: number, properties?: Record<string, any>): Promise<boolean> {
    return this.trackEvent(userId, {
      category: 'conversion',
      action: conversionType,
      value,
      properties
    });
  },
  
  /**
   * Registra uma interação do usuário
   * @param userId ID do usuário
   * @param component Componente onde ocorreu a interação
   * @param action Ação realizada
   * @param properties Propriedades adicionais
   * @returns Sucesso da operação
   */
  async trackInteraction(userId: string, component: string, action: string, properties?: Record<string, any>): Promise<boolean> {
    return this.trackEvent(userId, {
      category: 'interaction',
      action,
      label: component,
      properties
    });
  },
  
  /**
   * Registra uma pesquisa realizada pelo usuário
   * @param userId ID do usuário
   * @param searchTerm Termo pesquisado
   * @param resultsCount Quantidade de resultados
   * @returns Sucesso da operação
   */
  async trackSearch(userId: string, searchTerm: string, resultsCount: number): Promise<boolean> {
    return this.trackEvent(userId, {
      category: 'search',
      action: 'query',
      label: searchTerm,
      value: resultsCount,
      properties: {
        term: searchTerm,
        results: resultsCount
      }
    });
  }
};