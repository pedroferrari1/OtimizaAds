/*
  # Funções para gerenciamento de prompts

  1. Novas Funções
    - Função para obter versões de prompts
    - Função para obter prompt ativo por nome
  
  2. Segurança
    - Funções com SECURITY DEFINER para controle de acesso
    - Verificação de permissões administrativas
*/

-- Remover a função existente primeiro
DROP FUNCTION IF EXISTS get_prompt_versions();

-- Recriar a função para obter todas as versões de prompts
CREATE OR REPLACE FUNCTION get_prompt_versions()
RETURNS SETOF prompt_versions AS $$
BEGIN
  -- Verificar se o usuário é administrador
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permissão negada: apenas administradores podem visualizar prompts';
  END IF;

  RETURN QUERY
  SELECT *
  FROM prompt_versions
  ORDER BY prompt_name, version DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter o prompt ativo para um determinado nome
DROP FUNCTION IF EXISTS get_active_prompt(TEXT);

CREATE OR REPLACE FUNCTION get_active_prompt(prompt_name TEXT)
RETURNS TEXT AS $$
DECLARE
  prompt_content TEXT;
BEGIN
  SELECT content INTO prompt_content
  FROM prompt_versions
  WHERE prompt_name = $1
    AND is_active = TRUE
  ORDER BY version DESC
  LIMIT 1;

  RETURN prompt_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;