/*
  # Correção da função update_ai_configuration

  1. Alterações
    - Remove todas as versões existentes da função update_ai_configuration
    - Cria uma nova função update_ai_config_v2 com assinatura clara
    - Adiciona uma nova função para atualizar configurações de IA via JSON
  
  2. Segurança
    - Mantém verificação de permissão de administrador
    - Preserva o registro de auditoria
*/

-- Remover todas as versões existentes da função update_ai_configuration
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, uuid, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, jsonb, text);

-- Criar uma nova versão da função com nome diferente para evitar conflitos
CREATE OR REPLACE FUNCTION update_ai_config_v2(
  p_config_id UUID,
  p_config_level TEXT DEFAULT NULL,
  p_level_identifier TEXT DEFAULT NULL,
  p_model_id UUID DEFAULT NULL,
  p_system_prompt TEXT DEFAULT NULL,
  p_temperature NUMERIC DEFAULT NULL,
  p_max_tokens INTEGER DEFAULT NULL,
  p_top_p NUMERIC DEFAULT NULL,
  p_frequency_penalty NUMERIC DEFAULT NULL,
  p_presence_penalty NUMERIC DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  WHERE id = p_config_id;

  -- Verificar se a configuração existe
  IF old_values IS NULL THEN
    RAISE EXCEPTION 'Configuração não encontrada';
  END IF;

  -- Atualizar a configuração
  UPDATE ai_configurations 
  SET 
    config_level = COALESCE(p_config_level, config_level),
    level_identifier = COALESCE(p_level_identifier, level_identifier),
    model_id = COALESCE(p_model_id, model_id),
    system_prompt = COALESCE(p_system_prompt, system_prompt),
    temperature = COALESCE(p_temperature, temperature),
    max_tokens = COALESCE(p_max_tokens, max_tokens),
    top_p = COALESCE(p_top_p, top_p),
    frequency_penalty = COALESCE(p_frequency_penalty, frequency_penalty),
    presence_penalty = COALESCE(p_presence_penalty, presence_penalty),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_config_id;

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
    p_config_id,
    admin_id,
    'updated',
    old_values,
    jsonb_build_object(
      'config_level', p_config_level,
      'level_identifier', p_level_identifier,
      'model_id', p_model_id,
      'system_prompt', p_system_prompt,
      'temperature', p_temperature,
      'max_tokens', p_max_tokens,
      'top_p', p_top_p,
      'frequency_penalty', p_frequency_penalty,
      'presence_penalty', p_presence_penalty,
      'is_active', p_is_active
    ),
    p_change_reason,
    NOW()
  );
END;
$$;

-- Criar uma versão da função que aceita um objeto JSON para maior flexibilidade
CREATE OR REPLACE FUNCTION update_ai_configuration(
  config_id UUID,
  config_data JSONB,
  change_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Verificar se a configuração existe
  IF old_values IS NULL THEN
    RAISE EXCEPTION 'Configuração não encontrada';
  END IF;

  -- Atualizar a configuração
  UPDATE ai_configurations
  SET 
    config_level = COALESCE(config_data->>'config_level', config_level),
    level_identifier = COALESCE(config_data->>'level_identifier', level_identifier),
    model_id = COALESCE((config_data->>'model_id')::UUID, model_id),
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
    change_reason,
    NOW()
  );
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION update_ai_config_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_configuration TO authenticated;