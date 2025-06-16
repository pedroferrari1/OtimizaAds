/*
  # Melhorias no Sistema Administrativo
  
  1. Novas Tabelas
    - `admin_settings` - Configurações específicas do painel administrativo
    - `auth_logs` - Logs de autenticação e acesso ao sistema
    - `system_backups` - Registros de backups do sistema
    - `notification_templates` - Templates para notificações do sistema
  
  2. Alterações
    - Adição de campos para controle de segurança na tabela `profiles`
    - Criação de novo tipo enum para níveis de permissão mais granulares
  
  3. Segurança
    - Políticas RLS para todas as novas tabelas
    - Funções para verificação de permissões por nível
*/

-- Expandir o tipo enum user_role para incluir mais níveis de permissão
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MODERATOR';

-- Adicionar campos de segurança à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked_until timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_last_changed timestamptz;

-- Criar tabela para logs de autenticação
CREATE TABLE IF NOT EXISTS auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);

-- Habilitar RLS para auth_logs
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para auth_logs
CREATE POLICY "Admins can view all auth logs"
  ON auth_logs
  FOR SELECT
  TO public
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own auth logs"
  ON auth_logs
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

-- Criar tabela para configurações administrativas
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(category, key)
);

-- Habilitar RLS para admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_settings
CREATE POLICY "Admins can manage admin settings"
  ON admin_settings
  FOR ALL
  TO public
  USING (is_admin(auth.uid()));

CREATE POLICY "Moderators can view admin settings"
  ON admin_settings
  FOR SELECT
  TO public
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'MODERATOR'));

-- Inserir configurações padrão
INSERT INTO admin_settings (category, key, value, description, created_by, updated_by)
VALUES 
  ('security', 'password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_number": true, "require_special": true, "expiry_days": 90}', 'Política de senhas do sistema', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('security', 'login_attempts', '{"max_attempts": 5, "lockout_duration_minutes": 30}', 'Configurações de tentativas de login', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('email', 'smtp_settings', '{"host": "", "port": 587, "username": "", "password": "", "from_email": "", "from_name": "OtimizaAds"}', 'Configurações SMTP para envio de emails', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('system', 'backup', '{"auto_backup": false, "frequency": "daily", "retention_days": 30, "backup_time": "02:00"}', 'Configurações de backup automático', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (category, key) DO NOTHING;

-- Criar tabela para backups do sistema
CREATE TABLE IF NOT EXISTS system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  size_bytes bigint NOT NULL,
  backup_type text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  storage_path text,
  initiated_by uuid REFERENCES auth.users(id),
  notes text,
  metadata jsonb
);

-- Habilitar RLS para system_backups
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- Políticas para system_backups
CREATE POLICY "Admins can manage system backups"
  ON system_backups
  FOR ALL
  TO public
  USING (is_admin(auth.uid()));

-- Criar tabela para templates de notificação
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  subject text NOT NULL,
  body text NOT NULL,
  template_type text NOT NULL,
  variables jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS para notification_templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_templates
CREATE POLICY "Admins can manage notification templates"
  ON notification_templates
  FOR ALL
  TO public
  USING (is_admin(auth.uid()));

CREATE POLICY "Moderators can view notification templates"
  ON notification_templates
  FOR SELECT
  TO public
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'MODERATOR'));

-- Inserir templates padrão
INSERT INTO notification_templates (name, subject, body, template_type, variables, created_by, updated_by)
VALUES 
  ('password_reset', 'Redefinição de Senha - OtimizaAds', '<p>Olá {{name}},</p><p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:</p><p><a href="{{reset_link}}">Redefinir minha senha</a></p><p>Este link expira em 24 horas.</p><p>Se você não solicitou esta redefinição, ignore este email.</p><p>Atenciosamente,<br>Equipe OtimizaAds</p>', 'email', '["name", "reset_link"]', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  
  ('account_locked', 'Conta Bloqueada - OtimizaAds', '<p>Olá {{name}},</p><p>Sua conta foi temporariamente bloqueada devido a múltiplas tentativas de login malsucedidas.</p><p>Você poderá tentar novamente após {{lockout_time}}.</p><p>Se não foi você quem tentou acessar sua conta, recomendamos que altere sua senha imediatamente após o desbloqueio.</p><p>Atenciosamente,<br>Equipe OtimizaAds</p>', 'email', '["name", "lockout_time"]', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  
  ('subscription_payment_failed', 'Falha no Pagamento da Assinatura - OtimizaAds', '<p>Olá {{name}},</p><p>Não conseguimos processar o pagamento da sua assinatura.</p><p>Por favor, verifique seus dados de pagamento para evitar a interrupção dos serviços.</p><p>Detalhes:</p><ul><li>Plano: {{plan_name}}</li><li>Valor: {{amount}}</li><li>Data da tentativa: {{attempt_date}}</li></ul><p>Atenciosamente,<br>Equipe OtimizaAds</p>', 'email', '["name", "plan_name", "amount", "attempt_date"]', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Criar função para verificar se o usuário é moderador
CREATE OR REPLACE FUNCTION is_moderator(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'MODERATOR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para verificar permissões por nível
CREATE OR REPLACE FUNCTION has_permission(user_id uuid, required_role user_role)
RETURNS boolean AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val FROM profiles WHERE id = user_id;
  
  IF user_role_val = 'ADMIN' THEN
    RETURN TRUE;
  ELSIF user_role_val = 'MODERATOR' AND required_role IN ('MODERATOR', 'USER') THEN
    RETURN TRUE;
  ELSIF user_role_val = 'USER' AND required_role = 'USER' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para registrar tentativas de login
CREATE OR REPLACE FUNCTION log_auth_attempt(
  p_user_id uuid,
  p_action text,
  p_ip_address text,
  p_user_agent text,
  p_success boolean,
  p_details jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO auth_logs (
    user_id,
    action,
    ip_address,
    user_agent,
    success,
    details
  ) VALUES (
    p_user_id,
    p_action,
    p_ip_address,
    p_user_agent,
    p_success,
    p_details
  ) RETURNING id INTO log_id;
  
  -- Se for um login com sucesso, atualizar last_login e resetar failed_login_attempts
  IF p_success AND p_action = 'login' THEN
    UPDATE profiles
    SET 
      last_login = now(),
      failed_login_attempts = 0,
      account_locked = false,
      account_locked_until = NULL
    WHERE id = p_user_id;
  
  -- Se for um login com falha, incrementar failed_login_attempts e possivelmente bloquear a conta
  ELSIF NOT p_success AND p_action = 'login' THEN
    UPDATE profiles
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = p_user_id;
    
    -- Verificar se deve bloquear a conta
    UPDATE profiles
    SET 
      account_locked = true,
      account_locked_until = now() + interval '30 minutes'
    WHERE 
      id = p_user_id AND 
      failed_login_attempts >= (
        SELECT (value->>'max_attempts')::int 
        FROM admin_settings 
        WHERE category = 'security' AND key = 'login_attempts'
      );
  END IF;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;