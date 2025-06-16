/*
  # Adição de índices para otimização de performance

  1. Novas Tabelas
    - Nenhuma nova tabela criada
  
  2. Índices
    - Adiciona índices para melhorar a performance de consultas frequentes
    - Foco em tabelas com alto volume de consultas
  
  3. Otimizações
    - Melhora a performance de consultas de histórico
    - Otimiza consultas de assinaturas e métricas
*/

-- Índices para tabela history_items (consultas frequentes por usuário e tipo)
CREATE INDEX IF NOT EXISTS idx_history_items_user_type ON public.history_items (user_id, type);
CREATE INDEX IF NOT EXISTS idx_history_items_created_at ON public.history_items (created_at DESC);

-- Índices para tabela user_subscriptions (consultas por status e plano)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions (plan_id);

-- Índices para tabela usage_tracking (consultas por período)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON public.usage_tracking (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature_user ON public.usage_tracking (feature_type, user_id);

-- Índices para tabela ai_usage_metrics (consultas por modelo e serviço)
CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_model ON public.ai_usage_metrics (model_name);
CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_service ON public.ai_usage_metrics (service_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_user_service ON public.ai_usage_metrics (user_id, service_type);

-- Índices para tabela audit_logs (consultas por ação e usuário)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user ON public.audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON public.audit_logs (target_user_id);