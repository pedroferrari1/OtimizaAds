/*
  # Funções para gerenciamento de configurações de IA

  1. Funções
    - `update_ai_configuration`: Atualiza uma configuração de IA e registra a alteração no histórico
    - `get_active_ai_configuration`: Obtém a configuração ativa para um determinado nível e identificador
  
  2. Segurança
    - Todas as funções requerem autenticação
    - Verificação de permissões administrativas
*/

-- Função para atualizar uma configuração de IA e registrar a alteração no histórico
CREATE OR REPLACE FUNCTION update_ai_configuration(
  config_id UUID,
  config_data JSONB,
  reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  old_values JSONB;
  admin_id UUID;
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada: apenas administradores podem atualizar configurações de IA';
  END IF;

  -- Obter o ID do administrador
  admin_id := auth.uid();

  -- Obter os valores antigos para o histórico
  SELECT 
    jsonb_build_object(
      'config_level', config_level,
      'level_identifier', level_identifier,
      'model_id', model_id,
      'system_prompt', system_prompt,
      'temperature', temperature,
      'max_tokens', max_tokens,
      'top_p', top_p,
      'frequency_penalty', frequency_penalty,
      'presence_penalty', presence_penalty,
      'is_active', is_active
    )
  INTO old_values
  FROM ai_configurations
  WHERE id = config_id;

  -- Atualizar a configuração
  UPDATE ai_configurations
  SET 
    config_level = COALESCE(config_data->>'config_level', config_level),
    level_identifier = COALESCE(config_data->>'level_identifier', level_identifier),
    model_id = COALESCE(config_data->>'model_id', model_id)::UUID,
    system_prompt = COALESCE(config_data->>'system_prompt', system_prompt),
    temperature = COALESCE((config_data->>'temperature')::NUMERIC, temperature),
    max_tokens = COALESCE((config_data->>'max_tokens')::INTEGER, max_tokens),
    top_p = COALESCE((config_data->>'top_p')::NUMERIC, top_p),
    frequency_penalty = COALESCE((config_data->>'frequency_penalty')::NUMERIC, frequency_penalty),
    presence_penalty = COALESCE((config_data->>'presence_penalty')::NUMERIC, presence_penalty),
    is_active = COALESCE((config_data->>'is_active')::BOOLEAN, is_active),
    updated_at = NOW()
  WHERE id = config_id;

  -- Registrar a alteração no histórico
  INSERT INTO ai_config_history (
    config_id,
    admin_user_id,
    action,
    old_values,
    new_values,
    change_reason,
    timestamp
  ) VALUES (
    config_id,
    admin_id,
    'updated',
    old_values,
    config_data,
    reason,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter a configuração ativa para um determinado nível e identificador
CREATE OR REPLACE FUNCTION get_active_ai_configuration(
  level TEXT,
  identifier TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  config_json JSONB;
BEGIN
  -- Buscar configuração específica
  SELECT 
    jsonb_build_object(
      'id', ac.id,
      'config_level', ac.config_level,
      'level_identifier', ac.level_identifier,
      'model', jsonb_build_object(
        'id', am.id,
        'name', am.model_name,
        'provider', am.provider,
        'type', am.model_type
      ),
      'system_prompt', ac.system_prompt,
      'temperature', ac.temperature,
      'max_tokens', ac.max_tokens,
      'top_p', ac.top_p,
      'frequency_penalty', ac.frequency_penalty,
      'presence_penalty', ac.presence_penalty
    )
  INTO config_json
  FROM ai_configurations ac
  JOIN ai_models am ON ac.model_id = am.id
  WHERE 
    ac.config_level = level
    AND (
      (identifier IS NULL AND ac.level_identifier IS NULL)
      OR ac.level_identifier = identifier
    )
    AND ac.is_active = TRUE
  LIMIT 1;

  -- Se não encontrar configuração específica, buscar configuração global
  IF config_json IS NULL AND level != 'global' THEN
    SELECT 
      jsonb_build_object(
        'id', ac.id,
        'config_level', ac.config_level,
        'level_identifier', ac.level_identifier,
        'model', jsonb_build_object(
          'id', am.id,
          'name', am.model_name,
          'provider', am.provider,
          'type', am.model_type
        ),
        'system_prompt', ac.system_prompt,
        'temperature', ac.temperature,
        'max_tokens', ac.max_tokens,
        'top_p', ac.top_p,
        'frequency_penalty', ac.frequency_penalty,
        'presence_penalty', ac.presence_penalty
      )
    INTO config_json
    FROM ai_configurations ac
    JOIN ai_models am ON ac.model_id = am.id
    WHERE 
      ac.config_level = 'global'
      AND ac.is_active = TRUE
    LIMIT 1;
  END IF;

  RETURN config_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;