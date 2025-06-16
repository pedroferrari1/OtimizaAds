/*
  # Funções para Diagnóstico de Anúncios
  
  1. Novas Funções
     - `check_feature_usage`: Verifica o uso de uma funcionalidade por um usuário
     - `increment_usage_counter`: Incrementa o contador de uso de uma funcionalidade

  2. Alterações
     - Adiciona índices para melhorar performance nas consultas de uso
*/

-- Função para verificar o uso de uma funcionalidade
CREATE OR REPLACE FUNCTION check_feature_usage(user_uuid UUID, feature TEXT)
RETURNS TABLE(current_usage INT, limit_value INT, can_use BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
    feature_limit INT := 0;
    current_usage INT := 0;
    user_plan_features JSONB;
BEGIN
    -- Verificar plano do usuário
    SELECT 
        sp.features INTO user_plan_features
    FROM 
        user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE 
        us.user_id = user_uuid
        AND us.status = 'active';

    -- Se não tem assinatura ativa, ou é plano gratuito
    IF user_plan_features IS NULL THEN
        -- Definir limites para o plano gratuito
        IF feature = 'generations' THEN
            feature_limit := 5;
        ELSIF feature = 'diagnostics' THEN
            feature_limit := 3;
        ELSIF feature = 'funnel_analysis' THEN
            feature_limit := 1;
        ELSE
            feature_limit := 0;
        END IF;
    ELSE
        -- Pegar limite do plano
        IF feature = 'generations' THEN
            IF (user_plan_features->>'generations')::INT = -1 THEN
                -- -1 significa ilimitado
                feature_limit := -1;
            ELSE
                feature_limit := COALESCE((user_plan_features->>'generations')::INT, 0);
            END IF;
        ELSIF feature = 'diagnostics' THEN
            IF (user_plan_features->>'diagnostics')::INT = -1 THEN
                -- -1 significa ilimitado
                feature_limit := -1;
            ELSE
                feature_limit := COALESCE((user_plan_features->>'diagnostics')::INT, 0);
            END IF;
        ELSIF feature = 'funnel_analysis' THEN
            IF (user_plan_features->>'funnel_analysis')::INT = -1 THEN
                -- -1 significa ilimitado
                feature_limit := -1;
            ELSE
                feature_limit := COALESCE((user_plan_features->>'funnel_analysis')::INT, 0);
            END IF;
        ELSE
            feature_limit := 0;
        END IF;
    END IF;

    -- Buscar uso atual
    SELECT 
        COALESCE(SUM(count), 0) INTO current_usage
    FROM 
        usage_tracking
    WHERE 
        user_id = user_uuid
        AND feature_type = feature
        AND period_start >= current_month;

    -- Retornar uso atual, limite e se pode usar
    RETURN QUERY SELECT 
        current_usage, 
        feature_limit,
        CASE 
            WHEN feature_limit = -1 THEN TRUE -- ilimitado
            WHEN current_usage < feature_limit THEN TRUE
            ELSE FALSE
        END as can_use;
END;
$$;

-- Função para incrementar o contador de uso
CREATE OR REPLACE FUNCTION increment_usage_counter(user_uuid UUID, feature_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
    end_month DATE := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::DATE;
    usage_record_id UUID;
BEGIN
    -- Verificar se já existe registro para este mês
    SELECT id INTO usage_record_id
    FROM usage_tracking
    WHERE 
        user_id = user_uuid
        AND feature_type = feature_type
        AND period_start = current_month;
    
    IF found THEN
        -- Atualizar registro existente
        UPDATE usage_tracking
        SET count = count + 1, updated_at = now()
        WHERE id = usage_record_id;
    ELSE
        -- Criar novo registro
        INSERT INTO usage_tracking (
            user_id,
            feature_type,
            count,
            period_start,
            period_end
        ) VALUES (
            user_uuid,
            feature_type,
            1,
            current_month,
            end_month
        );
    END IF;
    
    -- Atualizar métricas de uso global
    INSERT INTO usage_metrics (
        metric_type,
        metric_value,
        date
    ) VALUES (
        feature_type || '_usage',
        1,
        CURRENT_DATE
    )
    ON CONFLICT (metric_type, date)
    DO UPDATE SET
        metric_value = usage_metrics.metric_value + 1;
END;
$$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature_user ON usage_tracking(feature_type, user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);