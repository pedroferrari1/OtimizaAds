
-- Tabela para métricas de saúde do sistema
CREATE TABLE public.system_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'uptime', 'latency', 'cpu', 'memory', 'error_rate'
  metric_value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela para logs de performance de API
CREATE TABLE public.api_performance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL, -- GET, POST, etc
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT
);

-- Tabela para logs de erro consolidados
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint TEXT,
  user_id UUID REFERENCES auth.users(id),
  frequency INTEGER DEFAULT 1,
  first_occurrence TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_occurrence TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved BOOLEAN DEFAULT false
);

-- Tabela para métricas específicas de IA
CREATE TABLE public.ai_usage_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  model_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'generation', 'diagnosis'
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10,6) DEFAULT 0,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN DEFAULT true
);

-- Tabela para configurações de alertas
CREATE TABLE public.alert_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  comparison_operator TEXT NOT NULL, -- '>', '<', '>=', '<=', '=='
  notification_method TEXT NOT NULL, -- 'email', 'webhook'
  notification_target TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para modelos de IA disponíveis
CREATE TABLE public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- 'novita', 'openai', etc
  model_type TEXT NOT NULL, -- 'chat', 'completion'
  cost_per_token DECIMAL(10,8) DEFAULT 0,
  max_tokens INTEGER,
  supports_streaming BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para configurações hierárquicas de IA
CREATE TABLE public.ai_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_level TEXT NOT NULL, -- 'global', 'plan', 'service'
  level_identifier TEXT, -- null para global, plan_name para plano, service_name para serviço
  model_id UUID REFERENCES public.ai_models(id),
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  top_p DECIMAL(3,2) DEFAULT 0.9,
  frequency_penalty DECIMAL(3,2) DEFAULT 0,
  presence_penalty DECIMAL(3,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(config_level, level_identifier)
);

-- Tabela para histórico de mudanças nas configurações de IA
CREATE TABLE public.ai_config_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES public.ai_configurations(id),
  admin_user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir alguns modelos de IA padrão
INSERT INTO public.ai_models (model_name, provider, model_type, cost_per_token, max_tokens, supports_streaming) VALUES
('meta-llama/llama-3.1-8b-instruct', 'novita', 'chat', 0.0000002, 4096, false),
('meta-llama/llama-3.1-70b-instruct', 'novita', 'chat', 0.0000008, 4096, false),
('gpt-4o-mini', 'openai', 'chat', 0.00000015, 4096, true),
('gpt-4o', 'openai', 'chat', 0.000005, 4096, true);

-- Inserir configuração global padrão
INSERT INTO public.ai_configurations (config_level, model_id, system_prompt, temperature, max_tokens) 
SELECT 
  'global',
  id,
  'Você é um assistente especializado em marketing digital e criação de anúncios. Seja criativo, persuasivo e sempre foque nos benefícios para o cliente.',
  0.7,
  2048
FROM public.ai_models WHERE model_name = 'meta-llama/llama-3.1-8b-instruct' LIMIT 1;

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins can manage system health metrics" ON public.system_health_metrics
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage API performance logs" ON public.api_performance_logs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage error logs" ON public.error_logs
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage AI usage metrics" ON public.ai_usage_metrics
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage alert configurations" ON public.alert_configurations
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage AI models" ON public.ai_models
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage AI configurations" ON public.ai_configurations
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view AI config history" ON public.ai_config_history
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Índices para performance
CREATE INDEX idx_system_health_metrics_type_timestamp ON public.system_health_metrics(metric_type, timestamp);
CREATE INDEX idx_api_performance_logs_endpoint_timestamp ON public.api_performance_logs(endpoint, timestamp);
CREATE INDEX idx_error_logs_type_timestamp ON public.error_logs(error_type, last_occurrence);
CREATE INDEX idx_ai_usage_metrics_user_timestamp ON public.ai_usage_metrics(user_id, timestamp);
CREATE INDEX idx_ai_configurations_level ON public.ai_configurations(config_level, level_identifier);
