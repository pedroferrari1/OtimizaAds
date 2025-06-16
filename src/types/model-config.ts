/**
 * Interface para configuração de modelos de IA
 * Contém todos os parâmetros específicos de modelos
 */
export interface ModelConfiguration {
  // Identificação do modelo
  name: string;
  provider_id: string;
  model_id: string; // ID do modelo na API do provedor
  
  // Parâmetros de geração
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  
  // Capacidades
  supports_streaming?: boolean;
  supports_vision?: boolean;
  
  // Custos
  cost_per_token_input?: number;
  cost_per_token_output?: number;
  
  // Estado
  is_active?: boolean;
}

/**
 * Interface para configuração de modelo com valores padrão
 */
export const DEFAULT_MODEL_CONFIG: ModelConfiguration = {
  name: "",
  provider_id: "",
  model_id: "",
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 0.9,
  frequency_penalty: 0,
  presence_penalty: 0,
  supports_streaming: true,
  supports_vision: false,
  cost_per_token_input: 0,
  cost_per_token_output: 0,
  is_active: true
};