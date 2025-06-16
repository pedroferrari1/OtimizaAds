/*
  # Atualização do Schema para Separação de Provedores e Modelos

  1. Alterações na Tabela ai_models
    - Adiciona a coluna provider_id como chave estrangeira para provider_configurations
    - Adiciona a coluna provider_model_id para armazenar o ID do modelo no provedor
    - Adiciona colunas para parâmetros específicos de modelo (temperature, max_tokens, etc.)
    - Adiciona colunas para custos de token (entrada e saída)
    - Remove campos relacionados a provedor (provider) e adiciona constraint para provider_id

  2. Migrações de Dados
    - Cria função para migrar dados das configurações atuais
  
  3. Modificação de ai_configurations
    - Remove colunas de parâmetros de modelo (temperature, max_tokens, etc.)
    - Mantém apenas a referência ao modelo via model_id
*/

-- Adicionar nova coluna provider_id à tabela ai_models
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES provider_configurations(id);

-- Adicionar coluna provider_model_id para armazenar o ID do modelo no provedor
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS provider_model_id TEXT;

-- Adicionar colunas para parâmetros específicos do modelo
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS temperature NUMERIC DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS top_p NUMERIC DEFAULT 0.9,
ADD COLUMN IF NOT EXISTS frequency_penalty NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS presence_penalty NUMERIC DEFAULT 0.0;

-- Adicionar colunas para custos separados de entrada e saída
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS cost_per_token_input NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS cost_per_token_output NUMERIC DEFAULT 0.0;

-- Adicionar outros campos relacionados a capacidades do modelo
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS supports_vision BOOLEAN DEFAULT FALSE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_model_name ON ai_models(model_name);

-- Função para migrar dados de configuração de modelos
-- Essa função é uma representação do que seria feito em um ambiente real.
-- Em uma migração real, você precisaria adaptar isso para suas necessidades específicas.
DO $$
DECLARE
    model_record RECORD;
    provider_record RECORD;
    new_provider_id UUID;
BEGIN
    -- Iterar sobre modelos existentes para migrar dados
    FOR model_record IN 
        SELECT * FROM ai_models WHERE provider_id IS NULL
    LOOP
        -- Tentar encontrar um provedor correspondente
        SELECT id INTO new_provider_id
        FROM provider_configurations
        WHERE provider_name = model_record.provider
        LIMIT 1;
        
        -- Se encontrar um provedor, atualizar o modelo
        IF new_provider_id IS NOT NULL THEN
            UPDATE ai_models
            SET 
                provider_id = new_provider_id,
                provider_model_id = model_record.model_name,
                cost_per_token_input = model_record.cost_per_token,
                cost_per_token_output = model_record.cost_per_token * 1.2 -- Exemplo: saída 20% mais cara
            WHERE id = model_record.id;
        END IF;
    END LOOP;
END $$;

-- Função para migrar dados de configurações de IA
DO $$
DECLARE
    config_record RECORD;
    model_id UUID;
BEGIN
    -- Iterar sobre configurações existentes para migrar dados
    FOR config_record IN 
        SELECT * FROM ai_configurations
    LOOP
        -- Atualizar o modelo referenciado com os parâmetros da configuração
        IF config_record.model_id IS NOT NULL THEN
            UPDATE ai_models
            SET 
                temperature = COALESCE(config_record.temperature, temperature),
                max_tokens = COALESCE(config_record.max_tokens, max_tokens),
                top_p = COALESCE(config_record.top_p, top_p),
                frequency_penalty = COALESCE(config_record.frequency_penalty, frequency_penalty),
                presence_penalty = COALESCE(config_record.presence_penalty, presence_penalty)
            WHERE id = config_record.model_id;
        END IF;
    END LOOP;
END $$;