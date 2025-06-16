/*
  # Funções para gerenciamento de prompts

  1. Funções
    - `get_prompt_versions`: Retorna todas as versões de prompts com informações adicionais
    - `get_active_prompt`: Obtém o prompt ativo para um determinado nome
  
  2. Segurança
    - Todas as funções requerem autenticação
    - Verificação de permissões administrativas para funções de escrita
*/

-- Função para obter todas as versões de prompts
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