# Documentação do Projeto OtimizaAds

## Visão Geral do Projeto

### Propósito e Objetivos
O OtimizaAds é uma plataforma de inteligência artificial projetada para ajudar empreendedores e profissionais de marketing a criar, otimizar e analisar anúncios publicitários. O sistema utiliza modelos avançados de IA para gerar textos persuasivos, diagnosticar problemas em anúncios existentes e fornecer recomendações de otimização baseadas em dados.

### Principais Funcionalidades
- **Gerador de Anúncios IA**: Cria anúncios persuasivos a partir de informações básicas do produto
- **Diagnóstico Inteligente**: Analisa anúncios existentes e identifica pontos de melhoria
- **Otimização com 1 Clique**: Melhora automaticamente anúncios com base em dados de performance
- **Análise de Concorrentes**: Fornece insights sobre estratégias de concorrentes
- **Sistema de Assinaturas**: Diferentes planos com recursos escalonados
- **Painel Administrativo**: Gerenciamento completo de usuários, assinaturas e configurações
- **Monitoramento de IA**: Acompanhamento de uso, performance e custos dos modelos de IA

### Público-Alvo
- Empreendedores e pequenos negócios
- Profissionais de marketing digital
- Agências de publicidade
- E-commerces e lojas online

### Stack Tecnológica
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Integrações**: Stripe (pagamentos), OpenAI/Anthropic/Novita (modelos de IA)
- **Monitoramento**: Sistema próprio de logs e métricas
- **Deployment**: Netlify

## Estrutura de Diretórios

### Visão Geral da Hierarquia

```
/
├── .github/                    # Configurações do GitHub (CI/CD, dependabot)
├── public/                     # Arquivos estáticos públicos
├── src/                        # Código-fonte principal
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── admin/              # Componentes do painel administrativo
│   │   ├── diagnosis/          # Componentes de diagnóstico de anúncios
│   │   ├── history/            # Componentes de histórico
│   │   ├── landing/            # Componentes da página inicial
│   │   ├── layout/             # Componentes de layout
│   │   ├── subscription/       # Componentes de assinatura
│   │   └── ui/                 # Componentes de UI básicos (shadcn)
│   ├── core/                   # Utilitários centrais
│   ├── features/               # Módulos de funcionalidades
│   │   ├── admin/              # Funcionalidades administrativas
│   │   ├── ads/                # Funcionalidades de anúncios
│   │   ├── auth/               # Autenticação e autorização
│   │   ├── dashboard/          # Dashboard do usuário
│   │   ├── history/            # Histórico de anúncios
│   │   ├── landing/            # Página inicial
│   │   └── subscription/       # Gerenciamento de assinaturas
│   ├── hooks/                  # Hooks React personalizados
│   ├── integrations/           # Integrações com serviços externos
│   │   └── supabase/           # Cliente e tipos do Supabase
│   ├── lib/                    # Bibliotecas e utilitários
│   ├── pages/                  # Páginas da aplicação
│   ├── shared/                 # Recursos compartilhados
│   └── types/                  # Definições de tipos TypeScript
├── supabase/                   # Configurações do Supabase
│   ├── functions/              # Edge Functions do Supabase
│   └── migrations/             # Migrações do banco de dados
```

### Propósito dos Diretórios Principais

#### `/src/components`
Contém todos os componentes React reutilizáveis, organizados por domínio. Os componentes são modulares e seguem o princípio de responsabilidade única.

#### `/src/features`
Organiza o código por funcionalidades de negócio, agrupando componentes, hooks e lógica relacionados a uma mesma feature.

#### `/src/hooks`
Hooks React personalizados que encapsulam lógica reutilizável, como gerenciamento de estado, chamadas de API e interações com o Supabase.

#### `/src/integrations`
Código para integração com serviços externos, como Supabase e Stripe, incluindo clientes, tipos e utilitários.

#### `/supabase/functions`
Edge Functions do Supabase para processamento serverless, incluindo integração com Stripe e processamento de IA.

#### `/supabase/migrations`
Migrações SQL para o banco de dados PostgreSQL do Supabase, definindo o esquema e as políticas de segurança.

### Convenções de Nomenclatura

- **Arquivos de Componentes**: PascalCase (ex: `SubscriptionPlans.tsx`)
- **Arquivos de Hooks**: camelCase com prefixo "use" (ex: `useSubscription.ts`)
- **Arquivos de Utilitários**: camelCase (ex: `utils.ts`)
- **Arquivos de Tipos**: camelCase (ex: `subscription.ts`)
- **Edge Functions**: kebab-case (ex: `create-checkout.ts`)

## Especificações Técnicas

### Autenticação e Autorização

#### Sistema de Autenticação
O sistema utiliza o Supabase Auth para gerenciamento de usuários e autenticação:

```typescript
// src/features/auth/AuthContext.tsx
const signIn = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  } catch (error: any) {
    console.error('Login exception:', error);
    return { error };
  }
};
```

#### Controle de Acesso
O sistema implementa dois níveis de controle de acesso:

1. **ProtectedRoute**: Para usuários autenticados
2. **AdminProtectedRoute**: Para administradores

```typescript
// src/features/auth/components/AdminProtectedRoute.tsx
const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### Integração com Supabase

#### Cliente Supabase
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dhijrvssbudlnhgtcpyo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

#### Políticas de Segurança RLS
O sistema utiliza Row Level Security (RLS) do PostgreSQL para controlar o acesso aos dados:

- Usuários só podem acessar seus próprios dados
- Administradores podem acessar todos os dados
- Políticas específicas para cada tabela

### Sistema de Assinaturas

#### Integração com Stripe
O sistema utiliza o Stripe para processamento de pagamentos e gerenciamento de assinaturas:

```typescript
// supabase/functions/create-checkout/index.ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  customer: customerId,
  line_items: [
    {
      price: plan.stripe_price_id,
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${req.headers.get('origin')}/app/assinatura?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${req.headers.get('origin')}/app/assinatura?canceled=true`,
  metadata: {
    user_id: user.id,
    plan_id: plan_id,
  },
});
```

#### Webhook para Eventos do Stripe
```typescript
// supabase/functions/stripe-webhook/index.ts
async function handleStripeEvent(event: Stripe.Event) {
  const { type, data } = event;

  switch (type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(data.object as Stripe.Checkout.Session);
      break;
    
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data.object as Stripe.Subscription);
      break;
    
    // Outros eventos...
  }
}
```

### Gerenciamento de Planos
O sistema permite a criação e gerenciamento de planos de assinatura com diferentes recursos:

```typescript
// src/features/admin/subscriptions/components/SubscriptionPlansManager.tsx
const savePlan = async (planData: Partial<SubscriptionPlan>) => {
  try {
    if (editingPlan?.id) {
      // Atualizar plano existente
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          ...planData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPlan.id);

      if (error) throw error;
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'plan_updated',
        details: { 
          plan_id: editingPlan.id,
          plan_name: planData.name,
          changes: JSON.stringify(planData)
        }
      });
      
      toast({
        title: "Plano atualizado",
        description: "Plano atualizado com sucesso.",
      });
    } else {
      // Criar novo plano
      const { error } = await supabase
        .from('subscription_plans')
        .insert(planData);

      if (error) throw error;
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'plan_created',
        details: { 
          plan_name: planData.name
        }
      });
      
      toast({
        title: "Plano criado",
        description: "Plano criado com sucesso.",
      });
    }

    fetchPlans();
    onPlanUpdated();
    setIsDialogOpen(false);
    setEditingPlan(null);
  } catch (error) {
    console.error('Erro ao salvar plano:', error);
    toast({
      title: "Erro",
      description: "Não foi possível salvar o plano.",
      variant: "destructive",
    });
  }
};
```

### Geração de Anúncios com IA

#### Hook de Geração de Anúncios
```typescript
// src/features/ads/hooks/useAdGenerator.ts
const handleGenerate = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsGenerating(true);

  try {
    // TODO: Integrate with Novita.ai API via Supabase Edge Function
    console.log("Generating ads for:", { productName, productDescription, targetAudience });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock generated ads
    const mockAds = [
      `🔥 ${productName} está aqui! ${productDescription.substring(0, 50)}... Perfeito para ${targetAudience}. Não perca esta oportunidade! 👇`,
      // Outros anúncios gerados...
    ];
    
    setGeneratedAds(mockAds);
    
    // Save to history
    const inputData = {
      productName,
      productDescription,
      targetAudience
    };
    await saveToHistory(inputData, mockAds);
    
    toast({
      title: "Anúncios gerados com sucesso!",
      description: "5 variações foram criadas para seu produto.",
    });
  } catch (error) {
    toast({
      title: "Erro ao gerar anúncios",
      description: "Tente novamente em alguns instantes.",
      variant: "destructive",
    });
  } finally {
    setIsGenerating(false);
  }
};
```

### Diagnóstico de Anúncios

#### Hook de Diagnóstico
```typescript
// src/features/ads/hooks/useDiagnosis.ts
const handleAnalyze = async () => {
  if (!adText.trim()) {
    toast({
      title: "Texto obrigatório",
      description: "Por favor, insira o texto do anúncio para análise.",
      variant: "destructive",
    });
    return;
  }

  setIsAnalyzing(true);

  try {
    console.log("Analyzing ad:", adText);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock diagnosis report
    const mockReport: DiagnosisReport = {
      clarityScore: 7.5,
      hookAnalysis: "O gancho inicial está adequado, mas poderia ser mais impactante...",
      ctaAnalysis: "A chamada para ação está presente, mas não transmite urgência...",
      mentalTriggers: ["Urgência", "Autoridade", "Prova Social"],
      suggestions: [
        "Adicione uma pergunta provocativa no início",
        // Outras sugestões...
      ]
    };
    
    setDiagnosisReport(mockReport);
    toast({
      title: "Análise concluída!",
      description: "Seu anúncio foi analisado com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro na análise",
      description: "Tente novamente em alguns instantes.",
      variant: "destructive",
    });
  } finally {
    setIsAnalyzing(false);
  }
};
```

### Histórico de Anúncios

#### Componente de Histórico
```typescript
// src/features/history/History.tsx
const fetchHistoryItems = async () => {
  try {
    setLoading(true);
    if (!user) {
      setHistoryItems([]);
      setLoading(false);
      return;
    }
    // Filtrar apenas itens do usuário logado
    const { data, error } = await supabase
      .from('history_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar seus itens do histórico.",
        variant: "destructive",
      });
    } else {
      setHistoryItems(data || []);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

### Painel Administrativo

#### Monitoramento de IA
```typescript
// src/components/admin/ai-config/AIMonitoring.tsx
const { data: usageMetrics } = useQuery({
  queryKey: ["ai-usage-metrics"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("ai_usage_metrics")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },
});

// Calcular métricas
const totalTokens = usageMetrics?.reduce((sum, metric) => 
  sum + (metric.tokens_input || 0) + (metric.tokens_output || 0), 0) || 0;

const totalCost = usageMetrics?.reduce((sum, metric) => 
  sum + (metric.estimated_cost || 0), 0) || 0;
```

#### Gerenciamento de Usuários
```typescript
// src/features/admin/users/AdminUsers.tsx
const handleUserAction = async () => {
  if (!actionDialog.user) return;

  try {
    let updateData: any = {};

    switch (actionDialog.type) {
      case 'makeAdmin':
        updateData = { role: 'ADMIN' };
        break;
      case 'removeAdmin':
        updateData = { role: 'USER' };
        break;
      default:
        return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', actionDialog.user.id);

    if (error) {
      throw error;
    }

    // Log da ação
    await supabase.from('audit_logs').insert({
      admin_user_id: (await supabase.auth.getUser()).data.user?.id,
      action: actionDialog.type === 'makeAdmin' ? 'user_promoted_to_admin' : 'user_removed_from_admin',
      target_user_id: actionDialog.user.id,
      details: { 
        user_email: actionDialog.user.email,
        previous_role: actionDialog.user.role,
        new_role: updateData.role 
      }
    });

    toast({
      title: "Operação realizada com sucesso",
      description: `Usuário ${actionDialog.type === 'makeAdmin' ? 'promovido a admin' : 'removido da função admin'} com sucesso.`,
    });

    // Atualizar lista
    await fetchUsers();
    setActionDialog({ open: false, type: 'activate', user: null });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    toast({
      title: "Erro ao atualizar usuário",
      description: "Não foi possível atualizar o usuário.",
      variant: "destructive",
    });
  }
};
```

## Instruções de Configuração

### Requisitos de Ambiente
- Node.js 18+ 
- npm 9+ ou yarn 1.22+
- Conta no Supabase
- Conta no Stripe (para processamento de pagamentos)

### Instalação

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

### Deployment

1. **Build do projeto**
   ```bash
   npm run build
   # ou
   yarn build
   ```

2. **Deploy no Netlify**
   ```bash
   netlify deploy --prod
   ```

3. **Deploy das Edge Functions do Supabase**
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy customer-portal
   supabase functions deploy stripe-webhook
   supabase functions deploy track-usage
   ```

## Arquitetura

### Visão Geral do Sistema
O OtimizaAds segue uma arquitetura baseada em serviços, com o frontend React se comunicando com o backend Supabase através de sua API REST e Edge Functions para operações mais complexas.

### Esquema do Banco de Dados

#### Tabelas Principais

1. **profiles**
   - Armazena informações dos usuários
   - Vinculada à tabela auth.users do Supabase

2. **subscription_plans**
   - Armazena os planos de assinatura disponíveis
   - Inclui preços, recursos e configurações

3. **user_subscriptions**
   - Relaciona usuários a planos de assinatura
   - Armazena status, datas de início/fim e informações de pagamento

4. **history_items**
   - Armazena o histórico de anúncios gerados e diagnósticos
   - Vinculada aos usuários

5. **ai_models**
   - Configurações dos modelos de IA disponíveis
   - Inclui custos, limites e parâmetros

6. **ai_usage_metrics**
   - Métricas de uso dos modelos de IA
   - Utilizada para monitoramento e faturamento

#### Relacionamentos

```
profiles (1) --- (N) history_items
profiles (1) --- (1) user_subscriptions
user_subscriptions (N) --- (1) subscription_plans
ai_models (1) --- (N) ai_usage_metrics
```

### Endpoints da API

#### Edge Functions

1. **create-checkout**
   - Cria uma sessão de checkout no Stripe
   - Parâmetros: `plan_id`
   - Retorno: URL de checkout

2. **customer-portal**
   - Cria uma sessão do portal de clientes do Stripe
   - Retorno: URL do portal

3. **stripe-webhook**
   - Processa eventos do webhook do Stripe
   - Atualiza assinaturas e registra pagamentos

4. **track-usage**
   - Registra o uso de recursos pelos usuários
   - Parâmetros: `feature_type`, `user_id`

### Fluxo de Dados

1. **Geração de Anúncios**
   - Usuário insere informações do produto
   - Frontend envia dados para o backend
   - Backend processa com modelo de IA
   - Resultado é retornado e salvo no histórico

2. **Diagnóstico de Anúncios**
   - Usuário insere texto do anúncio
   - Backend analisa com modelo de IA
   - Relatório de diagnóstico é gerado
   - Sugestões de otimização são apresentadas

3. **Assinatura**
   - Usuário seleciona plano
   - Frontend inicia checkout via Edge Function
   - Usuário completa pagamento no Stripe
   - Webhook do Stripe notifica o backend
   - Assinatura é ativada no banco de dados

## Configurações

### Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| VITE_SUPABASE_URL | URL do projeto Supabase | Sim |
| VITE_SUPABASE_ANON_KEY | Chave anônima do Supabase | Sim |
| VITE_STRIPE_PUBLISHABLE_KEY | Chave publicável do Stripe | Sim |
| SUPABASE_SERVICE_ROLE_KEY | Chave de serviço do Supabase (apenas para Edge Functions) | Sim |
| STRIPE_SECRET_KEY | Chave secreta do Stripe (apenas para Edge Functions) | Sim |
| STRIPE_WEBHOOK_SECRET | Segredo do webhook do Stripe (apenas para Edge Functions) | Sim |

### Configurações do Stripe

#### Produtos e Preços
O sistema utiliza os seguintes produtos no Stripe:

```typescript
// src/stripe-config.ts
export const STRIPE_PRODUCTS = {
  basicPlan: {
    id: 'prod_SOXxuGXLhfwrHs',
    priceId: 'price_1RaPvxAK3IULnjbOyRSzqEIO',
    name: 'Plano Básico',
    description: 'Assinatura Plano Básico OtimizaAds',
    mode: 'subscription',
  },
  intermediatePlan: {
    id: 'prod_SOXxvHYMigxsSt',
    priceId: 'price_1RaPwzAK3IULnjbOzTUzqFJP',
    name: 'Plano Intermediário',
    description: 'Assinatura Plano Intermediário OtimizaAds',
    mode: 'subscription',
  },
  premiumPlan: {
    id: 'prod_SOXxwIZNjhytTu',
    priceId: 'price_1RaPxzAK3IULnjbP0UVzrGKQ',
    name: 'Plano Premium',
    description: 'Assinatura Plano Premium OtimizaAds',
    mode: 'subscription',
  },
};
```

#### Webhooks
O Stripe deve ser configurado para enviar webhooks para:
```
https://seu-projeto.supabase.co/functions/v1/stripe-webhook
```

Com os seguintes eventos:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Configurações de IA

#### Modelos Suportados
O sistema suporta os seguintes provedores de IA:

1. **OpenAI**
   - GPT-4.1
   - GPT-4o
   - GPT-4o Mini
   - GPT-3.5 Turbo

2. **Anthropic**
   - Claude 3.5 Sonnet
   - Claude 3 Haiku
   - Claude 3 Opus

3. **Novita**
   - Llama 3.1 8B
   - Llama 3.1 70B
   - Llama 3.1 405B

4. **Google**
   - Gemini Pro
   - Gemini Pro Vision
   - Gemini 1.5 Pro

#### Configuração de Prompts
O sistema utiliza um editor de prompts para gerenciar os templates utilizados na geração e diagnóstico de anúncios:

```typescript
// src/components/admin/ai-config/PromptEditor.tsx
const createPromptMutation = useMutation({
  mutationFn: async (data: typeof formData) => {
    const { error } = await supabase
      .from("prompt_versions")
      .insert({
        prompt_name: data.prompt_name,
        version: data.version,
        content: data.content,
        description: data.description,
        is_active: true,
        created_by: "admin",
      });

    if (error) throw error;
  },
  // ...
});
```

## Integrações

### Supabase
O OtimizaAds utiliza o Supabase como backend principal, aproveitando:

- **Autenticação**: Gerenciamento de usuários e sessões
- **Banco de Dados**: PostgreSQL para armazenamento de dados
- **Edge Functions**: Processamento serverless
- **Row Level Security**: Políticas de segurança por linha

### Stripe
Integração completa com o Stripe para processamento de pagamentos:

- **Checkout Sessions**: Para criação de assinaturas
- **Customer Portal**: Para gerenciamento de assinaturas
- **Webhooks**: Para processamento de eventos
- **Products & Prices**: Para configuração de planos

### Provedores de IA
O sistema está preparado para integrar com múltiplos provedores de IA:

- **OpenAI**: Para modelos GPT
- **Anthropic**: Para modelos Claude
- **Novita**: Para modelos Llama
- **Google**: Para modelos Gemini

## Monitoramento e Logs

### Métricas de Uso
O sistema registra métricas detalhadas de uso:

- **Tokens consumidos**: Entrada e saída
- **Custo estimado**: Por requisição e agregado
- **Tempo de resposta**: Performance dos modelos
- **Taxa de sucesso**: Monitoramento de erros

### Logs de Erro
Sistema abrangente de logs para diagnóstico de problemas:

- **Tipo de erro**: Categorização de erros
- **Mensagem**: Descrição detalhada
- **Stack trace**: Para depuração
- **Frequência**: Contagem de ocorrências
- **Resolução**: Status de resolução

### Auditoria
Logs de auditoria para ações administrativas:

- **Usuário admin**: Quem realizou a ação
- **Ação**: O que foi feito
- **Detalhes**: Informações específicas
- **Timestamp**: Quando ocorreu

## Segurança

### Autenticação
- Autenticação baseada em JWT via Supabase Auth
- Proteção de rotas no frontend e backend
- Verificação de e-mail para novos cadastros

### Autorização
- Row Level Security (RLS) no banco de dados
- Verificação de função (USER/ADMIN) para acesso administrativo
- Políticas específicas por tabela

### Proteção de Dados
- Chaves de API armazenadas apenas no backend
- Dados sensíveis nunca expostos no frontend
- Logs de auditoria para todas as ações críticas

## Considerações de Performance

### Otimizações de Frontend
- Lazy loading de componentes
- Memoização de cálculos pesados
- Paginação de listas grandes

### Otimizações de Banco de Dados
- Índices nas colunas mais consultadas
- Consultas otimizadas
- Políticas RLS eficientes

### Caching
- React Query para caching de dados
- Invalidação seletiva de cache
- Estratégias de revalidação

## Roadmap Futuro

### Próximas Funcionalidades
1. **Editor Visual de Anúncios**: Interface drag-and-drop para criação de anúncios
2. **Integração com Plataformas**: Facebook Ads, Google Ads, etc.
3. **Análise de Imagens**: Diagnóstico de imagens de anúncios
4. **Multilingue**: Suporte a múltiplos idiomas
5. **API Pública**: Para integração com outras ferramentas

### Melhorias Planejadas
1. **Performance**: Otimização de consultas e renderização
2. **UX/UI**: Refinamentos na experiência do usuário
3. **Modelos de IA**: Integração com novos modelos
4. **Relatórios**: Análises mais detalhadas
5. **Mobile**: Aplicativo nativo para iOS e Android