# OtimizaAds - Plataforma de IA para Otimização de Anúncios

![Versão](https://img.shields.io/badge/versão-1.0.0-blue)
![Licença](https://img.shields.io/badge/licença-MIT-green)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)

## 📋 Visão Geral

**OtimizaAds** é uma plataforma avançada de inteligência artificial projetada para ajudar empreendedores e profissionais de marketing a criar, diagnosticar e otimizar anúncios com eficiência. Utilizando modelos de IA de última geração, a plataforma automatiza a criação de conteúdo persuasivo e oferece análises detalhadas para maximizar conversões em campanhas publicitárias.

## ✨ Recursos Principais

- **Gerador de Anúncios IA**: Crie anúncios persuasivos a partir de informações básicas do produto
- **Diagnóstico Inteligente**: Analise anúncios existentes e identifique pontos de melhoria
- **Laboratório de Otimização de Funil**: Analise a coerência entre anúncios e páginas de destino
- **Histórico Completo**: Acesse todos os anúncios gerados e diagnósticos realizados
- **Sistema de Assinaturas**: Diferentes planos com recursos escaláveis
- **Painel Administrativo**: Gerenciamento completo de usuários, assinaturas e configurações
- **Integração com Stripe**: Processamento seguro de pagamentos e assinaturas
- **Monitoramento de IA**: Acompanhamento de uso, performance e custos dos modelos de IA

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm 9+ ou yarn 1.22+
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com) (para processamento de pagamentos)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/otimizaads.git
   cd otimizaads
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   VITE_STRIPE_PUBLISHABLE_KEY=sua_chave_publicavel_do_stripe
   ```

4. **Configure as variáveis de ambiente do Supabase**
   
   No painel do Supabase, configure as seguintes variáveis para as Edge Functions:
   ```
   STRIPE_SECRET_KEY=sua_chave_secreta_do_stripe
   STRIPE_WEBHOOK_SECRET=seu_segredo_de_webhook_do_stripe
   ```

5. **Execute as migrações do banco de dados**
   ```bash
   npx supabase migration up
   ```

6. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

## 💻 Uso

### Geração de Anúncios

```javascript
// Exemplo de uso do hook de geração de anúncios
const { 
  productName, 
  setProductName,
  productDescription, 
  setProductDescription,
  targetAudience, 
  setTargetAudience,
  handleGenerate,
  generatedAds
} = useAdGenerator();

// Chamar a função para gerar anúncios
handleGenerate(event);
```

### Diagnóstico de Anúncios

```javascript
// Exemplo de uso do hook de diagnóstico
const {
  adText,
  setAdText,
  handleAnalyze,
  diagnosisReport
} = useDiagnosis();

// Analisar um anúncio
handleAnalyze();
```

### Integração com Stripe

```javascript
// Exemplo de criação de uma sessão de checkout
const { createCheckoutSession } = useSubscription();
await createCheckoutSession('plan-id-123');

// Exemplo de abertura do portal do cliente
const { manageSubscription } = useSubscription();
await manageSubscription();
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| VITE_SUPABASE_URL | URL do projeto Supabase | Sim |
| VITE_SUPABASE_ANON_KEY | Chave anônima do Supabase | Sim |
| VITE_STRIPE_PUBLISHABLE_KEY | Chave publicável do Stripe | Sim |
| SUPABASE_SERVICE_ROLE_KEY | Chave de serviço do Supabase (apenas para Edge Functions) | Sim |
| STRIPE_SECRET_KEY | Chave secreta do Stripe (apenas para Edge Functions) | Sim |
| STRIPE_WEBHOOK_SECRET | Segredo do webhook do Stripe (apenas para Edge Functions) | Sim |

### Configuração do Webhook do Stripe

Para configurar o webhook do Stripe, siga estes passos:

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/webhooks)
2. Clique em "Adicionar endpoint"
3. Insira a URL do seu webhook: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copie o "Signing Secret" gerado e configure-o nas variáveis de ambiente do Supabase

## 🛠️ Stack Tecnológica

### Frontend
- **React 18**: Biblioteca para construção de interfaces
- **TypeScript**: Tipagem estática para desenvolvimento seguro
- **Vite**: Ferramenta de build rápida
- **TailwindCSS**: Framework CSS utilitário
- **Shadcn/UI**: Componentes de UI reutilizáveis
- **React Router**: Roteamento de aplicação
- **React Query**: Gerenciamento de estado de servidor

### Backend
- **Supabase**: Plataforma de desenvolvimento com PostgreSQL, autenticação e mais
  - **PostgreSQL**: Banco de dados relacional
  - **Authentication**: Sistema de autenticação
  - **Storage**: Armazenamento de arquivos
  - **Edge Functions**: Funções serverless

### Integrações
- **Stripe**: Processamento de pagamentos e assinaturas
- **OpenAI/Anthropic/Novita**: Provedores de modelos de IA

## 📊 Estrutura do Projeto

O projeto segue uma arquitetura modular com separação de responsabilidades:

```
/
├── src/                         # Código-fonte principal
│   ├── components/              # Componentes React reutilizáveis
│   ├── features/                # Módulos de funcionalidades principais
│   │   ├── admin/               # Funcionalidades administrativas
│   │   ├── ads/                 # Funcionalidades de anúncios
│   │   ├── auth/                # Autenticação e autorização
│   │   ├── landing/             # Página inicial
│   │   └── subscription/        # Gerenciamento de assinaturas
│   ├── hooks/                   # Hooks React personalizados
│   ├── services/                # Serviços para lógica de negócio
│   ├── types/                   # Definições de tipos TypeScript
│   └── integrations/            # Integrações com serviços externos
├── supabase/                    # Configurações do Supabase
│   ├── functions/               # Edge Functions
│   └── migrations/              # Migrações do banco de dados
```

## 🤝 Contribuição

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Diretrizes para Contribuição

- Siga o padrão de código do projeto
- Mantenha a modularidade e a separação de responsabilidades
- Adicione testes para novas funcionalidades
- Documente suas alterações

## 📜 Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

## ❓ Solução de Problemas

### Problemas Comuns

#### Erro ao conectar com o Supabase
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Confirme se as URLs e chaves de API estão corretas
- Verifique o console do navegador para mensagens de erro específicas

#### Problemas com o Stripe
- Certifique-se de que o webhook está configurado corretamente
- Verifique se as chaves do Stripe estão configuradas nas variáveis de ambiente
- Verifique os logs de webhook no dashboard do Stripe

#### Erros de Edge Functions
- Verifique os logs das Edge Functions no dashboard do Supabase
- Confirme se as funções estão implantadas corretamente
- Verifique se as variáveis de ambiente estão configuradas nas funções

## 📞 Contato e Suporte

- **Email**: contato@otimizaads.com
- **Website**: [www.otimizaads.com](https://www.otimizaads.com)
- **Suporte**: suporte@otimizaads.com

---

Desenvolvido com ❤️ pela equipe OtimizaAds.