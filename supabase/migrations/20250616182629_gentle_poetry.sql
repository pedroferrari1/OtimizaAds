/*
  # Configuração para funções de otimização de funil

  1. Função para verificação de uso do otimizador de funil
  
  Esta migração cria a função check_funnel_analysis_usage que:
  - Verifica se o usuário pode usar o recurso de análise de funil
  - Retorna informações de uso atual e limites
  - Considera o plano de assinatura do usuário
*/

-- Remover a versão anterior da função, se existir
DROP FUNCTION IF EXISTS check_funnel_analysis_usage(uuid);

-- Criar a função com o tipo de retorno correto
CREATE OR REPLACE FUNCTION check_funnel_analysis_usage(user_uuid uuid)
RETURNS TABLE (
  can_use boolean,
  current_usage integer,
  limit_value integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan_id uuid;
  plan_features jsonb;
  funnel_limit integer := 0;
  current_period_start timestamp with time zone;
  current_period_end timestamp with time zone;
  usage_count integer := 0;
BEGIN
  -- Verificar se o usuário está autenticado
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter plano atual do usuário
  SELECT us.plan_id INTO user_plan_id
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid 
    AND us.status = 'active';

  -- Se não tem plano ativo, verificar se é admin
  IF user_plan_id IS NULL THEN
    -- Verificar se é admin (admins têm acesso ilimitado)
    IF is_admin(user_uuid) THEN
      RETURN QUERY SELECT true, 0, -1; -- -1 indica ilimitado
      RETURN;
    ELSE
      -- Usuário sem plano ativo - configurar limites gratuitos
      RETURN QUERY SELECT true, 0, 1; -- 1 análise gratuita
      RETURN;
    END IF;
  END IF;

  -- Obter configurações do plano
  SELECT sp.features INTO plan_features
  FROM subscription_plans sp
  WHERE sp.id = user_plan_id;

  -- Extrair limite de análises de funil
  IF plan_features ? 'funnel_analysis' THEN
    funnel_limit := (plan_features->>'funnel_analysis')::integer;
  END IF;

  -- Se limite é 0, usuário não tem acesso
  IF funnel_limit = 0 THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Se limite é -1, acesso ilimitado
  IF funnel_limit = -1 THEN
    RETURN QUERY SELECT true, 0, -1;
    RETURN;
  END IF;

  -- Calcular período atual (mês atual)
  current_period_start := date_trunc('month', now());
  current_period_end := (date_trunc('month', now()) + interval '1 month' - interval '1 second');

  -- Obter uso atual no período
  SELECT COALESCE(ut.count, 0) INTO usage_count
  FROM usage_tracking ut
  WHERE ut.user_id = user_uuid 
    AND ut.feature_type = 'funnel_analysis'
    AND ut.period_start = current_period_start;

  -- Verificar se pode usar (não atingiu o limite)
  RETURN QUERY SELECT 
    (usage_count < funnel_limit),
    usage_count,
    funnel_limit;
END;
$$;

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION check_funnel_analysis_usage(uuid) TO authenticated;

-- Criar tabela para logs de análise de funil se não existir
CREATE TABLE IF NOT EXISTS funnel_analysis_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_text text NOT NULL,
  landing_page_text text NOT NULL,
  coherence_score numeric(3,1) NOT NULL,
  suggestions jsonb,
  optimized_ad text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE funnel_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Política para visualização de logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funnel_analysis_logs' 
    AND policyname = 'Users can view their own funnel analysis logs'
  ) THEN
    CREATE POLICY "Users can view their own funnel analysis logs" 
      ON funnel_analysis_logs FOR SELECT 
      TO public 
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- Política para admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'funnel_analysis_logs' 
    AND policyname = 'Admins can view all funnel analysis logs'
  ) THEN
    CREATE POLICY "Admins can view all funnel analysis logs" 
      ON funnel_analysis_logs FOR SELECT 
      TO public 
      USING (is_admin(auth.uid()));
  END IF;
END
$$;

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_logs_user_id 
  ON funnel_analysis_logs(user_id);
  
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_logs_created_at 
  ON funnel_analysis_logs(created_at);