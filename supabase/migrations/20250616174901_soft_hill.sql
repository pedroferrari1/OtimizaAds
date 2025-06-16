/*
  # Sistema de cache

  1. Nova Tabela
    - `system_cache`: Armazena dados em cache para otimizar performance
      - `id` (uuid, chave primária)
      - `key` (text, único)
      - `value` (jsonb)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
  
  2. Segurança
    - Habilitar RLS na tabela `system_cache`
    - Adicionar política para administradores
  
  3. Performance
    - Índices para chave e data de expiração
    - Função para limpeza de cache expirado
*/

-- Criar tabela de cache do sistema se não existir
CREATE TABLE IF NOT EXISTS system_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Habilitar RLS para a tabela de cache
ALTER TABLE system_cache ENABLE ROW LEVEL SECURITY;

-- Criar política para administradores apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'system_cache' 
    AND policyname = 'Admins can manage system cache'
  ) THEN
    CREATE POLICY "Admins can manage system cache"
      ON system_cache
      FOR ALL
      TO public
      USING (is_admin(auth.uid()));
  END IF;
END
$$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_system_cache_key ON system_cache(key);
CREATE INDEX IF NOT EXISTS idx_system_cache_expires_at ON system_cache(expires_at);

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

-- Conceder permissões para a função
GRANT EXECUTE ON FUNCTION clean_expired_cache TO authenticated;