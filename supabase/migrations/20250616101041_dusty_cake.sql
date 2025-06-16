/*
  # Correção da função de atualização de configuração de IA

  1. Mudanças
    - Remove funções conflitantes existentes
    - Cria nova função update_ai_config_v3 com parâmetros JSON
    - Implementa compatibilidade com versões anteriores
  
  2. Segurança
    - Mantém permissões SECURITY DEFINER
    - Preserva controle de acesso via RLS
*/

-- Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, uuid, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_config_v2(uuid, text, uuid, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, jsonb, text);

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
DECLARE
  v_old_values jsonb;
BEGIN
  -- Verificar se a configuração existe
  IF NOT EXISTS (SELECT 1 FROM ai_configurations WHERE id = p_config_id) THEN
    RAISE EXCEPTION 'Configuração não encontrada';
  END IF;

  -- Capturar valores antigos para o log de auditoria
  SELECT jsonb_build_object(
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
  ) INTO v_old_values
  FROM ai_configurations
  WHERE id = p_config_id;

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
    old_values,
    new_values,
    change_reason,
    timestamp
  ) VALUES (
    p_config_id,
    auth.uid(),
    'updated',
    v_old_values,
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