/*
  # Configuração do Laboratório de Otimização de Funil

  1. Novas Tabelas
    - `system_cache` - Armazena resultados em cache para otimização de performance
    - `funnel_analysis_logs` - Registra análises de funil realizadas
  
  2. Alterações
    - Adição de campo `funnel_analysis` na tabela `subscription_plans.features`
    - Atualização de tipos para suportar novos tipos de histórico
  
  3. Segurança
    - Políticas RLS para todas as novas tabelas
    - Funções para gerenciamento de cache
*/

-- Criar tabela de cache do sistema
CREATE TABLE IF NOT EXISTS system_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Habilitar RLS para a tabela de cache
ALTER TABLE system_cache ENABLE ROW LEVEL SECURITY;

-- Criar política para administradores
CREATE POLICY "Admins can manage system cache"
  ON system_cache
  FOR ALL
  TO public
  USING (is_admin(auth.uid()));

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM system_cache
  WHERE expires_at < now();
END;
$$;

-- Criar tabela para logs de análise de funil
CREATE TABLE IF NOT EXISTS funnel_analysis_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  ad_text text NOT NULL,
  landing_page_text text NOT NULL,
  coherence_score numeric(3,1) NOT NULL,
  suggestions jsonb,
  optimized_ad text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS para a tabela de logs
ALTER TABLE funnel_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela de logs
CREATE POLICY "Users can view their own funnel analysis logs"
  ON funnel_analysis_logs
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all funnel analysis logs"
  ON funnel_analysis_logs
  FOR SELECT
  TO public
  USING (is_admin(auth.uid()));

-- Atualizar o tipo de history_items para incluir funnel_analysis
DO $$
BEGIN
  ALTER TABLE history_items
  DROP CONSTRAINT IF EXISTS history_items_type_check;
  
  ALTER TABLE history_items
  ADD CONSTRAINT history_items_type_check
  CHECK (type = ANY (ARRAY['generation'::text, 'diagnosis'::text, 'funnel_analysis'::text]));
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_logs_user_id ON funnel_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_logs_created_at ON funnel_analysis_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_cache_key ON system_cache(key);
CREATE INDEX IF NOT EXISTS idx_system_cache_expires_at ON system_cache(expires_at);

-- Adicionar configuração de IA para o serviço de análise de funil
INSERT INTO ai_configurations (
  config_level,
  level_identifier,
  model_id,
  system_prompt,
  temperature,
  max_tokens,
  top_p,
  frequency_penalty,
  presence_penalty,
  is_active
) 
SELECT 
  'service',
  'funnel_analysis',
  (SELECT id FROM ai_models WHERE model_name = 'gpt-4o' LIMIT 1),
  'Você é um especialista em marketing de performance e otimização de funis de conversão (CRO). Sua tarefa é analisar a coerência entre anúncios e páginas de destino, fornecendo diagnósticos precisos e sugestões acionáveis para melhorar as taxas de conversão.',
  0.7,
  2048,
  0.9,
  0.0,
  0.0,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM ai_configurations 
  WHERE config_level = 'service' AND level_identifier = 'funnel_analysis'
);

-- Criar função para verificar limites de uso do funnel_analysis
CREATE OR REPLACE FUNCTION check_funnel_analysis_usage(user_uuid uuid)
RETURNS TABLE (
  current_usage integer,
  limit_value integer,
  can_use boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_id uuid;
  v_plan_features jsonb;
  v_limit integer;
  v_current_usage integer;
  v_period_start date;
  v_period_end date;
BEGIN
  -- Definir período atual (mês atual)
  v_period_start := date_trunc('month', current_date)::date;
  v_period_end := (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date;
  
  -- Obter plano do usuário
  SELECT plan_id INTO v_plan_id
  FROM user_subscriptions
  WHERE user_id = user_uuid
    AND status = 'active';
  
  -- Se não tiver plano ativo, usar limite do plano gratuito
  IF v_plan_id IS NULL THEN
    v_limit := 3; -- Limite padrão para plano gratuito
  ELSE
    -- Obter features do plano
    SELECT features INTO v_plan_features
    FROM subscription_plans
    WHERE id = v_plan_id;
    
    -- Obter limite específico para funnel_analysis
    IF v_plan_features ? 'funnel_analysis' AND jsonb_typeof(v_plan_features->'funnel_analysis') = 'number' THEN
      v_limit := (v_plan_features->>'funnel_analysis')::integer;
    ELSIF v_plan_features ? 'funnel_analysis' AND v_plan_features->>'funnel_analysis' = 'true' THEN
      v_limit := -1; -- Ilimitado
    ELSE
      v_limit := 0; -- Não disponível
    END IF;
  END IF;
  
  -- Obter uso atual
  SELECT COALESCE(SUM(count), 0) INTO v_current_usage
  FROM usage_tracking
  WHERE user_id = user_uuid
    AND feature_type = 'funnel_analysis'
    AND period_start >= v_period_start
    AND period_end <= v_period_end;
  
  -- Determinar se pode usar
  RETURN QUERY
  SELECT 
    v_current_usage AS current_usage,
    v_limit AS limit_value,
    (v_limit = -1 OR v_current_usage < v_limit) AS can_use;
END;
$$;

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION check_funnel_analysis_usage TO authenticated;