/*
  # Remover tabelas relacionadas ao Asaas

  1. Remoção de Tabelas
    - Remover a tabela `asaas_customer_mapping`
    - Remover a tabela `asaas_webhooks`
  
  2. Limpeza
    - Remover todas as políticas RLS associadas
*/

-- Remover tabela de mapeamento de clientes Asaas
DROP TABLE IF EXISTS asaas_customer_mapping;

-- Remover tabela de webhooks do Asaas
DROP TABLE IF EXISTS asaas_webhooks;