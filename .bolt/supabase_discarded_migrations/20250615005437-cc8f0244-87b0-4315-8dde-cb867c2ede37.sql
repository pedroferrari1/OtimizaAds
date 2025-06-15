
-- Criar enum para roles de usuário
CREATE TYPE public.user_role AS ENUM ('USER', 'ADMIN');

-- Adicionar coluna role na tabela profiles
ALTER TABLE public.profiles ADD COLUMN role user_role DEFAULT 'USER' NOT NULL;

-- Criar tabela para configurações globais da aplicação
CREATE TABLE public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela para métricas de uso agregadas
CREATE TABLE public.usage_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type text NOT NULL,
  metric_value integer NOT NULL DEFAULT 0,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(metric_type, date)
);

-- Criar tabela para logs de auditoria
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'ADMIN'
  );
$$;

-- Políticas RLS para app_settings (apenas admins podem ler/escrever)
CREATE POLICY "Admins can read app_settings" ON public.app_settings
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert app_settings" ON public.app_settings
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update app_settings" ON public.app_settings
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete app_settings" ON public.app_settings
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Políticas RLS para usage_metrics (apenas admins podem ler)
CREATE POLICY "Admins can read usage_metrics" ON public.usage_metrics
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert usage_metrics" ON public.usage_metrics
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Políticas RLS para audit_logs (apenas admins podem ler)
CREATE POLICY "Admins can read audit_logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Política atualizada para profiles (admins podem ver todos os perfis)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()) OR auth.uid() = id);

-- Inserir configurações iniciais
INSERT INTO public.app_settings (key, value, description) VALUES
  ('free_plan_limit', '{"daily_ads": 5, "monthly_ads": 100}', 'Limites do plano gratuito'),
  ('features', '{"ad_generator": true, "ad_diagnosis": true}', 'Features habilitadas globalmente'),
  ('api_limits', '{"novita_tokens_per_month": 10000}', 'Limites de API externa');

-- Criar um usuário admin inicial (substitua o email pelo seu)
-- UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'admin@otimizaads.com';
