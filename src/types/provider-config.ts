// Tipos para configuração de provedores de IA

/**
 * Interface para configuração de provedores de IA
 * Contém apenas dados de autenticação e conexão, sem parâmetros de modelo
 */
export interface ProviderConfiguration {
  api_key?: string;
  api_endpoint?: string;
  organization_id?: string;
  auth_type?: string;
  timeout?: number;
}

/**
 * Interface para configuração de provedor OpenAI
 */
interface OpenAIConfig extends ProviderConfiguration {
  organization_id?: string;
}

/**
 * Interface para configuração de provedor Anthropic
 */
interface AnthropicConfig extends ProviderConfiguration {
  api_version?: string;
}

/**
 * Interface para configuração de provedor Novita
 */
interface NovitaConfig extends ProviderConfiguration {
  project_id?: string;
}

/**
 * Interface para configuração de provedor Google
 */
interface GeminiConfig extends ProviderConfiguration {
  project_id?: string;
}

/**
 * Interface para configuração de provedor DeepSeek
 */
interface DeepSeekConfig extends ProviderConfiguration {
}

/**
 * Interface para configuração de provedor compatível com OpenAI
 */
interface OpenAICompatibleConfig extends ProviderConfiguration {
  custom_endpoint: true;
}

// Type guard para verificar se a configuração é válida
const isProviderConfiguration = (config: any): config is ProviderConfiguration => {
  return typeof config === 'object' && config !== null;
};

/**
 * Extrai a configuração de provedor de um objeto genérico
 */
export const getProviderConfig = (config: any): ProviderConfiguration => {
  if (isProviderConfiguration(config)) {
    return config;
  }
  return {};
};