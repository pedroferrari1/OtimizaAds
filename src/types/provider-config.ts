
// Provider configuration types
export interface ProviderConfiguration {
  api_key?: string;
  supports_streaming?: boolean;
  supports_vision?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  timeout?: number;
  custom_endpoint?: boolean;
  [key: string]: any;
}

export interface OpenAIConfig extends ProviderConfiguration {
  model?: string;
  organization_id?: string;
}

export interface AnthropicConfig extends ProviderConfiguration {
  model?: string;
  version?: string;
}

export interface NovitaConfig extends ProviderConfiguration {
  model?: string;
  engine?: string;
}

export interface GeminiConfig extends ProviderConfiguration {
  model?: string;
  project_id?: string;
}

export interface DeepSeekConfig extends ProviderConfiguration {
  model?: string;
}

export interface OpenAICompatibleConfig extends ProviderConfiguration {
  model?: string;
  custom_endpoint: true;
}

// Type guard functions
export const isProviderConfiguration = (config: any): config is ProviderConfiguration => {
  return typeof config === 'object' && config !== null;
};

export const getProviderConfig = (config: any): ProviderConfiguration => {
  if (isProviderConfiguration(config)) {
    return config;
  }
  return {};
};
