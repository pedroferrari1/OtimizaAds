import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para opções de cache
 */
export interface CacheOptions {
  /**
   * Tempo de expiração em horas (padrão: 24h)
   */
  expiryHours?: number;
}

/**
 * Serviço para gerenciamento de cache no sistema
 */
export const cacheService = {
  /**
   * Define um valor no cache
   * @param key Chave do cache
   * @param value Valor a ser armazenado
   * @param options Opções de cache
   * @returns Sucesso da operação
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const expiryHours = options?.expiryHours || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);
      
      // Armazenar no cache
      const { error } = await supabase
        .from('system_cache')
        .upsert({
          key,
          value: value as any,
          expires_at: expiresAt.toISOString()
        }, { onConflict: 'key' });
        
      return !error;
    } catch (error) {
      console.error('Erro ao definir cache:', error);
      return false;
    }
  },
  
  /**
   * Obtém um valor do cache
   * @param key Chave do cache
   * @returns Valor armazenado ou null se não existir ou estiver expirado
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from('system_cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();
      
      if (error) return null;
      
      // Verificar se está expirado
      if (data && new Date(data.expires_at) > new Date()) {
        return data.value as T;
      }
      
      // Se estiver expirado, excluir o registro
      if (data) {
        await supabase
          .from('system_cache')
          .delete()
          .eq('key', key);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter cache:', error);
      return null;
    }
  },
  
  /**
   * Remove um valor do cache
   * @param key Chave do cache
   * @returns Sucesso da operação
   */
  async remove(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_cache')
        .delete()
        .eq('key', key);
        
      return !error;
    } catch (error) {
      console.error('Erro ao remover cache:', error);
      return false;
    }
  },
  
  /**
   * Limpa o cache expirado
   * @returns Sucesso da operação
   */
  async cleanExpired(): Promise<boolean> {
    try {
      // Chamar a função RPC para limpar cache expirado
      const { error } = await supabase.rpc('clean_expired_cache');
      return !error;
    } catch (error) {
      console.error('Erro ao limpar cache expirado:', error);
      return false;
    }
  }
};