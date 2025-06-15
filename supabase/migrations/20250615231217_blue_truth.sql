/*
  # Mapeamento de clientes Asaas

  1. Nova Tabela
    - `asaas_customer_mapping`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key para profiles)
      - `asaas_customer_id` (text, não nulo)
      - `created_at` (timestamp, default now())
      - `updated_at` (timestamp, default now())
  2. Security
    - Enable RLS on `asaas_customer_mapping` table
    - Add policy for admins to manage mappings
*/

-- Criar tabela para mapear usuários do OtimizaAds com clientes do Asaas
CREATE TABLE IF NOT EXISTS asaas_customer_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asaas_customer_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_asaas_customer_mapping_user_id ON asaas_customer_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_asaas_customer_mapping_asaas_customer_id ON asaas_customer_mapping(asaas_customer_id);

-- Adicionar restrição de unicidade para user_id e asaas_customer_id
ALTER TABLE asaas_customer_mapping ADD CONSTRAINT unique_user_id UNIQUE (user_id);
ALTER TABLE asaas_customer_mapping ADD CONSTRAINT unique_asaas_customer_id UNIQUE (asaas_customer_id);

-- Habilitar RLS
ALTER TABLE asaas_customer_mapping ENABLE ROW LEVEL SECURITY;

-- Criar política para administradores
CREATE POLICY "Admins can manage asaas_customer_mapping"
  ON asaas_customer_mapping
  FOR ALL
  TO public
  USING (is_admin(uid()));

-- Criar política para usuários visualizarem seu próprio mapeamento
CREATE POLICY "Users can view own asaas_customer_mapping"
  ON asaas_customer_mapping
  FOR SELECT
  TO public
  USING (user_id = uid());