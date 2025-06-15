/*
  # Criação da tabela de webhooks do Asaas

  1. Nova Tabela
    - `asaas_webhooks`
      - `id` (uuid, primary key)
      - `event` (text, não nulo)
      - `payload` (jsonb, não nulo)
      - `processed` (boolean, default false)
      - `processed_at` (timestamp)
      - `created_at` (timestamp, default now())
  2. Security
    - Enable RLS on `asaas_webhooks` table
    - Add policy for admins to manage webhooks
*/

-- Criar tabela para armazenar webhooks do Asaas
CREATE TABLE IF NOT EXISTS asaas_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Adicionar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_event ON asaas_webhooks(event);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_processed ON asaas_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhooks_created_at ON asaas_webhooks(created_at);

-- Habilitar RLS
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;

-- Criar política para administradores
CREATE POLICY "Admins can manage asaas_webhooks"
  ON asaas_webhooks
  FOR ALL
  TO public
  USING (is_admin(uid()));