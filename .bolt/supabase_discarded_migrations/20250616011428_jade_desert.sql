/*
  # Correção da função update_ai_configuration

  1. Mudanças
    - Remove todas as versões existentes da função update_ai_configuration
    - Cria uma nova versão com nome único para evitar conflitos
    - Mantém a mesma funcionalidade da versão anterior
  
  2. Segurança
    - Mantém a política SECURITY DEFINER
    - Concede permissões apenas para usuários autenticados
*/

-- Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, uuid, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, text, numeric, integer, numeric, numeric, numeric, boolean);
DROP FUNCTION IF EXISTS update_ai_configuration(uuid, text, text, numeric, integer, numeric, numeric, numeric, boolean);

-- Criar a função com um nome único para evitar conflitos
CREATE OR REPLACE FUNCTION update_ai_config_v2(
  p_config_id uuid,
  p_config_level text DEFAULT NULL,
  p_model_id uuid DEFAULT NULL,
  p_system_prompt text DEFAULT NULL,
  p_temperature numeric DEFAULT NULL,
  p_max_tokens integer DEFAULT NULL,
  p_top_p numeric DEFAULT NULL,
  p_frequency_penalty numeric DEFAULT NULL,
  p_presence_penalty numeric DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
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
    config_level = COALESCE(p_config_level, config_level),
    model_id = COALESCE(p_model_id, model_id),
    system_prompt = COALESCE(p_system_prompt, system_prompt),
    temperature = COALESCE(p_temperature, temperature),
    max_tokens = COALESCE(p_max_tokens, max_tokens),
    top_p = COALESCE(p_top_p, top_p),
    frequency_penalty = COALESCE(p_frequency_penalty, frequency_penalty),
    presence_penalty = COALESCE(p_presence_penalty, presence_penalty),
    is_active = COALESCE(p_is_active, is_active),
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
    jsonb_build_object(
      'config_level', p_config_level,
      'model_id', p_model_id,
      'system_prompt', p_system_prompt,
      'temperature', p_temperature,
      'max_tokens', p_max_tokens,
      'top_p', p_top_p,
      'frequency_penalty', p_frequency_penalty,
      'presence_penalty', p_presence_penalty,
      'is_active', p_is_active
    ),
    'Configuração atualizada via painel administrativo',
    now()
  );
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION update_ai_config_v2 TO authenticated;

-- Criar uma função de compatibilidade para manter código existente funcionando
-- Esta função simplesmente chama a nova versão
CREATE OR REPLACE FUNCTION update_ai_configuration(
  p_config_id uuid,
  p_config_level text,
  p_model_id uuid,
  p_system_prompt text,
  p_temperature numeric,
  p_max_tokens integer,
  p_top_p numeric,
  p_frequency_penalty numeric,
  p_presence_penalty numeric,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM update_ai_config_v2(
    p_config_id,
    p_config_level,
    p_model_id,
    p_system_prompt,
    p_temperature,
    p_max_tokens,
    p_top_p,
    p_frequency_penalty,
    p_presence_penalty,
    p_is_active
  );
END;
$$;

-- Conceder permissões para a função de compatibilidade
GRANT EXECUTE ON FUNCTION update_ai_configuration TO authenticated;