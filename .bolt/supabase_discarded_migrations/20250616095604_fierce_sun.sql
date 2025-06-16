/*
  # Correção da função de atualização de configuração de IA

  1. Mudanças
    - Remove funções existentes de update_ai_configuration
    - Cria uma nova função update_ai_config_v3 com nome único
    - Cria uma função de compatibilidade update_ai_configuration
  
  2. Segurança
    - Ambas as funções são SECURITY DEFINER
    - Permissões concedidas apenas para usuários autenticados
*/

-- Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, uuid, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_config_v2(uuid, text, uuid, text, numeric, integer, numeric, numeric, numeric, boolean);

-- Criar a função com um nome único para evitar conflitos
CREATE OR REPLACE FUNCTION update_ai_config_v3(
  p_config_id uuid,
  p_config_data jsonb,
  p_change_reason text DEFAULT 'Atualização via painel administrativo'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a configuração existe
  IF NOT EXISTS (SELECT 1 FROM ai_configurations WHERE id = p_config_id) THEN
    RAISE EXCEPTION 'Configuração não encontrada';
  END IF;

  -- Atualizar a configuração
  UPDATE ai_configurations 
  SET 
    config_level = COALESCE(p_config_data->>'config_level', config_level),
    level_identifier = COALESCE(p_config_data->>'level_identifier', level_identifier),
    model_id = COALESCE((p_config_data->>'model_id')::uuid, model_id),
    system_prompt = COALESCE(p_config_data->>'system_prompt', system_prompt),
    temperature = COALESCE((p_config_data->>'temperature')::numeric, temperature),
    max_tokens = COALESCE((p_config_data->>'max_tokens')::integer, max_tokens),
    top_p = COALESCE((p_config_data->>'top_p')::numeric, top_p),
    frequency_penalty = COALESCE((p_config_data->>'frequency_penalty')::numeric, frequency_penalty),
    presence_penalty = COALESCE((p_config_data->>'presence_penalty')::numeric, presence_penalty),
    is_active = COALESCE((p_config_data->>'is_active')::boolean, is_active),
    updated_at = now()
  WHERE id = p_config_id;

  -- Registrar no histórico de configurações
  INSERT INTO ai_config_history (
    config_id,
    admin_user_id,
    action,
    new_values,
    change_reason,
    timestamp
  ) VALUES (
    p_config_id,
    auth.uid(),
    'updated',
    p_config_data,
    p_change_reason,
    now()
  );
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION update_ai_config_v3 TO authenticated;

-- Criar uma função de compatibilidade para manter código existente funcionando
CREATE OR REPLACE FUNCTION update_ai_configuration(
  p_config_id uuid,
  p_config_data jsonb,
  p_change_reason text DEFAULT 'Atualização via painel administrativo'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM update_ai_config_v3(p_config_id, p_config_data, p_change_reason);
END;
$$;

-- Conceder permissões para a função de compatibilidade
GRANT EXECUTE ON FUNCTION update_ai_configuration TO authenticated;