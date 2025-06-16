
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

interface OpenAIConfig extends ProviderConfiguration {
  model?: string;
  organization_id?: string;
}

interface AnthropicConfig extends ProviderConfiguration {
  model?: string;
  version?: string;
}

interface NovitaConfig extends ProviderConfiguration {
  model?: string;
  engine?: string;
}

interface GeminiConfig extends ProviderConfiguration {
  model?: string;
  project_id?: string;
}

interface DeepSeekConfig extends ProviderConfiguration {
  model?: string;
}

interface OpenAICompatibleConfig extends ProviderConfiguration {
  model?: string;
  custom_endpoint: true;
}

// Type guard functions
const isProviderConfiguration = (config: any): config is ProviderConfiguration => {
  return typeof config === 'object' && config !== null;
};

export const getProviderConfig = (config: any): ProviderConfiguration => {
  if (isProviderConfiguration(config)) {
    return config;
  }
  return {};
};
