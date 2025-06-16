# OtimizaAds - Integração com Stripe

Este projeto implementa uma integração completa com a API de pagamentos Stripe para o sistema OtimizaAds.

## Funcionalidades Implementadas

### 1. Configuração e Autenticação
- Autenticação via API key
- Configuração de endpoints para ambiente de produção
- Tratamento de erros e timeouts
- Logs de todas as requisições e respostas

### 2. Gerenciamento de Clientes
- Criar cliente automaticamente durante o checkout
- Associar cliente ao usuário do sistema
- Consultar cliente por ID
- Gerenciar dados do cliente

### 3. Cobranças e Pagamentos
- Criar assinaturas recorrentes
- Processar pagamentos via cartão de crédito
- Consultar status de assinaturas
- Webhooks para notificações de pagamento

### 4. Arquitetura
- Implementação seguindo clean code e princípios SOLID
- Validações robustas de dados
- Segurança para dados sensíveis

## Estrutura do Projeto

```
supabase/
  ├── functions/
  │   ├── create-checkout/      # Endpoint para criar sessão de checkout
  │   ├── customer-portal/      # Endpoint para gerenciar assinaturas
  │   └── stripe-webhook/       # Endpoint para receber webhooks do Stripe
  └── migrations/
      └── create_stripe_tables.sql  # Tabelas para armazenar dados do Stripe

src/
  ├── components/
  │   └── subscription/
  │       └── SubscriptionPlans.tsx  # Componente de interface para assinaturas
  ├── hooks/
  │   └── useSubscription.ts    # Hook para gerenciar assinaturas
  └── stripe-config.ts          # Configuração dos produtos do Stripe
```

## Configuração

### Variáveis de Ambiente

As seguintes variáveis de ambiente devem ser configuradas no projeto Supabase:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Configuração de Webhook no Stripe

1. Acesse o painel do Stripe
2. Vá em Developers > Webhooks
3. Adicione a URL do webhook: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos que deseja receber (recomendado: todos relacionados a pagamentos e assinaturas)

## Uso

### Gerenciamento de Assinaturas

```typescript
// Criar uma sessão de checkout
const { data } = await supabase.functions.invoke('create-checkout', {
  body: { plan_id: 'plano-basico' }
});

// Abrir portal de gerenciamento
const { data } = await supabase.functions.invoke('customer-portal');
```

## Segurança

- Todas as chamadas à API do Stripe são feitas pelo backend (Edge Functions)
- A chave secreta é armazenada como variável de ambiente
- Autenticação e autorização são verificadas em todas as funções
- Verificação de assinatura dos webhooks

## Tratamento de Erros

O sistema implementa tratamento robusto de erros, incluindo:

- Validação de dados de entrada
- Logs detalhados de erros
- Mensagens de erro amigáveis para o usuário

## Webhooks

O sistema processa os seguintes eventos de webhook:

- `checkout.session.completed`: Checkout concluído
- `customer.subscription.created`: Assinatura criada
- `customer.subscription.updated`: Assinatura atualizada
- `customer.subscription.deleted`: Assinatura cancelada
- `invoice.paid`: Fatura paga
- `invoice.payment_failed`: Falha no pagamento

## Contribuição

Para contribuir com este projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request