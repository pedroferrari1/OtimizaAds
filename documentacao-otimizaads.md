# Documentação do Projeto OtimizaAds

## Visão Geral do Projeto

### Propósito e Objetivos
O OtimizaAds é uma plataforma de inteligência artificial projetada para ajudar empreendedores e profissionais de marketing a criar, otimizar e analisar anúncios publicitários. O sistema utiliza modelos avançados de IA para gerar textos persuasivos, diagnosticar problemas em anúncios existentes, analisar a coerência de funil de vendas e fornecer recomendações de otimização baseadas em dados.

### Principais Funcionalidades
- **Gerador de Anúncios IA**: Cria anúncios persuasivos a partir de informações básicas do produto
- **Diagnóstico Inteligente**: Analisa anúncios existentes e identifica pontos de melhoria
- **Laboratório de Otimização de Funil**: Analisa a coerência entre anúncios e páginas de destino
- **Histórico Completo**: Armazena todas as gerações e diagnósticos para referência futura
- **Sistema de Assinaturas**: Diferentes planos com recursos escalonados
- **Painel Administrativo**: Gerenciamento completo de usuários, assinaturas e configurações
- **Monitoramento de IA**: Acompanhamento de uso, performance e custos dos modelos de IA

### Público-Alvo
- Empreendedores e pequenos negócios
- Profissionais de marketing digital
- Agências de publicidade
- E-commerces e lojas online

### Stack Tecnológica
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI
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
│   │   ├── funnel-optimizer/   # Componentes de otimização de funil
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
│   ├── services/               # Serviços para lógica de negócio
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

#### `/src/services`
Serviços que encapsulam a lógica de negócio e interações com APIs, seguindo o padrão de serviço.

#### `/supabase/functions`
Edge Functions do Supabase para processamento serverless, incluindo integração com Stripe e processamento de IA.

#### `/supabase/migrations`
Migrações SQL para o banco de dados PostgreSQL do Supabase, definindo o esquema e as políticas de segurança.

### Convenções de Nomenclatura

- **Arquivos de Componentes**: PascalCase (ex: `SubscriptionPlans.tsx`)
- **Arquivos de Hooks**: camelCase com prefixo "use" (ex: `useSubscription.ts`)
- **Arquivos de Utilitários**: camelCase (ex: `utils.ts`)
- **Arquivos de Tipos**: camelCase (ex: `subscription.ts`)
- **Edge Functions**: kebab-case (ex: `funnel-optimizer.ts`)

## Especificações Técnicas

### Autenticação e Autorização

#### Sistema de Autenticação
O sistema utiliza o Supabase Auth para gerenciamento de usuários e autenticação:

```typescript
// src/features/auth/context/AuthContext.tsx
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
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>;
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

#### Políticas de Segurança RLS
O sistema utiliza Row Level Security (RLS) do PostgreSQL para controlar o acesso aos dados:

- Usuários só podem acessar seus próprios dados
- Administradores podem acessar todos os dados
- Políticas específicas para cada tabela

Exemplo de política RLS para histórico:
```sql
-- Política para visualização de histórico
CREATE POLICY "Users can view own history" 
ON history_items 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
```

### Sistema de Assinaturas

#### Integração com Stripe
O sistema utiliza o Stripe para processamento de pagamentos e gerenciamento de assinaturas:

```typescript
// src/services/subscriptionService.ts
async createCheckoutSession(planId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan_id: planId }
    });

    if (error) throw error;
    return data?.url || null;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    toast({
      title: "Erro",
      description: "Não foi possível iniciar o checkout.",
      variant: "destructive",
    });
    return null;
  }
}
```

#### Edge Function para Checkout
```typescript
// supabase/functions/create-checkout/index.ts
Deno.serve(async (req) => {
  try {
    const { plan_id } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Criar ou obter cliente no Stripe
    let customerId;
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();
    
    if (customer) {
      customerId = customer.customer_id;
    } else {
      // Criar novo cliente no Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      
      customerId = newCustomer.id;
      
      // Salvar no banco de dados
      await supabase
        .from('stripe_customers')
        .insert({
          user_id: user.id,
          customer_id: customerId
        });
    }
    
    // Criar sessão de checkout
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
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Webhook para Eventos do Stripe
```typescript
// supabase/functions/stripe-webhook/index.ts
Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não fornecida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar assinatura do webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Erro de assinatura do webhook: ${err.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Processar evento
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
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
    // Validar entrada
    if (!productName.trim() || !productDescription.trim() || !targetAudience.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para gerar anúncios.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se o usuário pode usar o serviço (verificar limite do plano)
    if (user) {
      const { data, error } = await supabase.rpc('check_feature_usage', {
        user_uuid: user.id,
        feature: 'generations'
      });
      
      if (error) throw error;
      
      if (data && data[0] && !data[0].can_use) {
        throw new Error('Você atingiu o limite de gerações do seu plano.');
      }
    }
    
    // Chamar a Edge Function do Supabase
    const { data, error } = await supabase.functions.invoke('ad-generator', {
      body: { 
        productName, 
        productDescription, 
        targetAudience 
      }
    });
    
    if (error) throw error;
    
    if (!data || !Array.isArray(data.ads)) {
      throw new Error('Resposta inválida da API');
    }
    
    // Incrementar contador de uso da funcionalidade
    if (user) {
      await supabase.rpc('increment_usage_counter', {
        p_user_uuid: user.id,
        p_feature_type: 'generations'
      });
    }
    
    setGeneratedAds(data.ads);
    
    // Salvar no histórico
    const inputData = {
      productName,
      productDescription,
      targetAudience
    };
    await saveToHistory(inputData, data.ads);
    
    toast({
      title: "Anúncios gerados com sucesso!",
      description: `${data.ads.length} variações foram criadas para seu produto.`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Tente novamente em alguns instantes.";
    toast({
      title: "Erro ao gerar anúncios",
      description: errorMessage,
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
  // Validar e formatar o texto do anúncio
  const validation = validateAndFormatText(adText);
  if (!validation.isValid) {
    toast({
      title: "Erro de validação",
      description: validation.error,
      variant: "destructive",
    });
    return;
  }

  // Usar o texto formatado
  const formattedAdText = validation.formattedText!;
  
  setIsAnalyzing(true);

  try {
    // Verificar se o usuário pode usar o serviço (verificar limite do plano)
    if (user) {
      const { data, error } = await supabase.rpc('check_feature_usage', {
        user_uuid: user.id,
        feature: 'diagnostics'
      });
      
      if (error) throw error;
      
      if (data && data[0] && !data[0].can_use) {
        throw new Error('Você atingiu o limite de diagnósticos do seu plano.');
      }
    }
    
    // Chamar a Edge Function do Supabase
    const { data, error } = await supabase.functions.invoke('ad-diagnosis', {
      body: { adText: formattedAdText }
    });
    
    if (error) throw error;
    
    if (!data || !data.clarityScore) {
      throw new Error('Resposta inválida da API');
    }
    
    // Incrementar contador de uso da funcionalidade
    if (user) {
      await supabase.rpc('increment_usage_counter', {
        p_user_uuid: user.id,
        p_feature_type: 'diagnostics'
      });
    }
    
    setDiagnosisReport(data);
    
    // Salvar diagnóstico no histórico
    await saveToHistory(formattedAdText, data);
    
    toast({
      title: "Análise concluída!",
      description: "Seu anúncio foi analisado com sucesso.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Tente novamente em alguns instantes.";
    toast({
      title: "Erro na análise",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsAnalyzing(false);
  }
};
```

### Otimização de Funil

#### Hook de Otimização de Funil
```typescript
// src/hooks/useFunnelOptimizer.ts
const handleAnalyze = async () => {
  // Validar textos de entrada
  const validation = validateTexts();
  if (!validation.valid) {
    toast({
      title: "Validação",
      description: validation.message,
      variant: "destructive",
    });
    return;
  }

  if (!canUseFeature) {
    toast({
      title: "Limite atingido",
      description: "Você atingiu o limite de análises do seu plano. Faça upgrade para continuar.",
      variant: "destructive",
    });
    return;
  }

  setIsAnalyzing(true);

  try {
    // Chamar a Edge Function do Supabase
    const { data, error } = await supabase.functions.invoke('funnel-optimizer', {
      body: { 
        adText: adText.trim(), 
        landingPageText: landingPageText.trim() 
      }
    });
    
    if (error) throw error;
    
    if (!data || !data.funnelCoherenceScore) {
      throw new Error('Resposta inválida da API');
    }
    
    // Atualizar dados de uso após análise bem-sucedida
    await checkFeatureUsage();
    
    // Definir resultados
    setAnalysisResults(data);
    
    // Salvar no histórico
    await saveToHistory(adText, landingPageText, data);

    toast({
      title: "Análise concluída!",
      description: `Pontuação de coerência: ${data.funnelCoherenceScore}/10`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Verificar se é um erro de limite de plano
    if (errorMessage.includes('não inclui acesso')) {
      setCanUseFeature(false);
      toast({
        title: "Recurso não disponível",
        description: "Seu plano atual não inclui acesso ao Laboratório de Otimização de Funil. Faça upgrade para continuar.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erro na análise",
        description: errorMessage || "Não foi possível analisar os textos. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
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
const metrics = usageMetrics ? {
  totalRequests: usageMetrics.length,
  totalTokensInput: usageMetrics.reduce((sum, m) => sum + (m.tokens_input || 0), 0),
  totalTokensOutput: usageMetrics.reduce((sum, m) => sum + (m.tokens_output || 0), 0),
  totalCost: usageMetrics.reduce((sum, m) => sum + (m.estimated_cost || 0), 0),
  avgResponseTime: usageMetrics.length > 0 
    ? usageMetrics.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / usageMetrics.length 
    : 0,
  successRate: usageMetrics.length > 0 
    ? (usageMetrics.filter(m => m.success).length / usageMetrics.length) * 100 
    : 0,
} : {
  totalRequests: 0,
  totalTokensInput: 0,
  totalTokensOutput: 0,
  totalCost: 0,
  avgResponseTime: 0,
  successRate: 0,
};
```

#### Gerenciamento de Usuários
```typescript
// src/features/admin/AdminUsers.tsx
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

## Esquema do Banco de Dados

### Tabelas Principais

#### `profiles`
Armazena informações dos usuários, vinculada à tabela auth.users do Supabase.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  role USER_ROLE NOT NULL DEFAULT 'USER'::USER_ROLE
);

-- Enum para roles de usuário
CREATE TYPE USER_ROLE AS ENUM ('USER', 'ADMIN');
```

#### `subscription_plans`
Armazena os planos de assinatura disponíveis.

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  price_monthly INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  stripe_price_id TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `user_subscriptions`
Relaciona usuários a planos de assinatura.

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
```

#### `history_items`
Armazena o histórico de anúncios gerados e diagnósticos.

```sql
CREATE TABLE history_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('generation', 'diagnosis', 'funnel_analysis')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  input_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
```

#### `ai_models`
Configurações dos modelos de IA disponíveis.

```sql
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT UNIQUE NOT NULL,
  provider UUID REFERENCES provider_configurations(id),
  model_type TEXT NOT NULL,
  cost_per_token_input NUMERIC(10,8) DEFAULT 0,
  cost_per_token_output NUMERIC(10,8) DEFAULT 0,
  max_tokens INTEGER,
  temperature NUMERIC DEFAULT 0.7,
  top_p NUMERIC DEFAULT 0.9,
  frequency_penalty NUMERIC DEFAULT 0,
  presence_penalty NUMERIC DEFAULT 0,
  supports_streaming BOOLEAN DEFAULT false,
  supports_vision BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_model_id TEXT
);
```

#### `ai_usage_metrics`
Métricas de uso dos modelos de IA.

```sql
CREATE TABLE ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  model_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  estimated_cost NUMERIC(10,6) DEFAULT 0,
  response_time_ms INTEGER,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN DEFAULT true
);
```

#### `usage_tracking`
Rastreamento de uso de recursos por usuário.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_type, period_start)
);
```

### Relacionamentos

```
profiles (1) --- (N) history_items
profiles (1) --- (1) user_subscriptions
user_subscriptions (N) --- (1) subscription_plans
ai_models (1) --- (N) ai_usage_metrics
profiles (1) --- (N) usage_tracking
```

## Edge Functions

### Endpoints da API

#### `ad-generator`
- **Método**: POST
- **Descrição**: Gera anúncios com base nas informações do produto
- **Parâmetros**:
  - `productName`: Nome do produto
  - `productDescription`: Descrição do produto
  - `targetAudience`: Público-alvo
- **Retorno**: Array de anúncios gerados

```typescript
// supabase/functions/ad-generator/index.ts
Deno.serve(async (req) => {
  try {
    const { productName, productDescription, targetAudience } = await req.json();
    
    // Validar entrada
    if (!productName || !productDescription || !targetAudience) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros incompletos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter configuração do modelo
    const modelConfig = await getModelConfig('generation');
    
    // Construir prompt
    const prompt = `
      Gere 5 anúncios persuasivos para o seguinte produto:
      
      Nome do produto: ${productName}
      Descrição: ${productDescription}
      Público-alvo: ${targetAudience}
      
      Os anúncios devem ser curtos, persuasivos e incluir emojis estratégicos.
      Cada anúncio deve ter um gancho forte, benefícios claros e uma chamada para ação.
    `;
    
    // Chamar API de IA
    const response = await callAIProvider(modelConfig, prompt);
    
    // Processar resposta
    const ads = processAIResponse(response);
    
    // Registrar uso
    await trackAIUsage(modelConfig, prompt, response);
    
    return new Response(
      JSON.stringify({ ads }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### `ad-diagnosis`
- **Método**: POST
- **Descrição**: Analisa um anúncio existente
- **Parâmetros**:
  - `adText`: Texto do anúncio a ser analisado
- **Retorno**: Relatório de diagnóstico

```typescript
// supabase/functions/ad-diagnosis/index.ts
Deno.serve(async (req) => {
  try {
    const { adText } = await req.json();
    
    // Validar entrada
    if (!adText) {
      return new Response(
        JSON.stringify({ error: 'Texto do anúncio não fornecido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter configuração do modelo
    const modelConfig = await getModelConfig('diagnosis');
    
    // Construir prompt
    const prompt = `
      Analise o seguinte anúncio e forneça um diagnóstico detalhado:
      
      "${adText}"
      
      Forneça:
      1. Uma pontuação de clareza de 0-10
      2. Análise do gancho inicial
      3. Análise da chamada para ação
      4. Gatilhos mentais presentes ou que deveriam ser usados
      5. Sugestões específicas de melhoria
    `;
    
    // Chamar API de IA
    const response = await callAIProvider(modelConfig, prompt);
    
    // Processar resposta
    const diagnosis = processAIDiagnosis(response);
    
    // Registrar uso
    await trackAIUsage(modelConfig, prompt, response);
    
    return new Response(
      JSON.stringify(diagnosis),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### `funnel-optimizer`
- **Método**: POST
- **Descrição**: Analisa a coerência entre anúncio e página de destino
- **Parâmetros**:
  - `adText`: Texto do anúncio
  - `landingPageText`: Texto da página de destino
- **Retorno**: Análise de coerência e sugestões

```typescript
// supabase/functions/funnel-optimizer/index.ts
Deno.serve(async (req) => {
  try {
    const { adText, landingPageText } = await req.json();
    
    // Validar entrada
    if (!adText || !landingPageText) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros incompletos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se o usuário tem acesso ao recurso
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se o usuário pode usar o recurso
    const { data: usageData, error: usageError } = await supabase.rpc('check_funnel_analysis_usage', {
      user_uuid: user.id
    });
    
    if (usageError) {
      return new Response(
        JSON.stringify({ error: usageError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!usageData[0].can_use) {
      return new Response(
        JSON.stringify({ error: 'Limite de uso atingido ou plano não inclui acesso a esta funcionalidade' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter configuração do modelo
    const modelConfig = await getModelConfig('funnel_analysis');
    
    // Verificar cache
    const cacheKey = `funnel_analysis:${hashString(adText + landingPageText)}`;
    const { data: cacheData } = await supabase
      .from('system_cache')
      .select('value')
      .eq('key', cacheKey)
      .maybeSingle();
    
    if (cacheData) {
      // Incrementar contador de uso
      await incrementUsageCounter(user.id, 'funnel_analysis');
      
      // Registrar hit de cache
      await incrementMetric('cache_hits');
      
      return new Response(
        JSON.stringify(cacheData.value),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Registrar miss de cache
    await incrementMetric('cache_misses');
    
    // Construir prompt
    const prompt = `
      Analise a coerência entre o seguinte anúncio e sua página de destino:
      
      ANÚNCIO:
      "${adText}"
      
      PÁGINA DE DESTINO:
      "${landingPageText}"
      
      Forneça:
      1. Uma pontuação de coerência de 0-10
      2. Diagnóstico do anúncio
      3. Diagnóstico da página de destino
      4. Sugestões para melhorar a coerência
      5. Uma versão otimizada do anúncio que melhore a coerência
    `;
    
    // Chamar API de IA
    const startTime = Date.now();
    const response = await callAIProvider(modelConfig, prompt);
    const processingTime = Date.now() - startTime;
    
    // Processar resposta
    const analysis = processFunnelAnalysis(response);
    
    // Salvar no cache
    await supabase
      .from('system_cache')
      .insert({
        key: cacheKey,
        value: analysis,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    
    // Registrar uso
    await incrementUsageCounter(user.id, 'funnel_analysis');
    
    // Registrar métricas
    await supabase
      .from('funnel_analysis_logs')
      .insert({
        user_id: user.id,
        ad_text: adText,
        landing_page_text: landingPageText,
        coherence_score: analysis.funnelCoherenceScore,
        suggestions: analysis.syncSuggestions,
        optimized_ad: analysis.optimizedAd,
        processing_time_ms: processingTime
      });
    
    // Registrar uso de IA
    await trackAIUsage(modelConfig, prompt, response, user.id, processingTime);
    
    return new Response(
      JSON.stringify(analysis),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### `create-checkout`
- **Método**: POST
- **Descrição**: Cria uma sessão de checkout no Stripe
- **Parâmetros**: `plan_id`
- **Retorno**: URL de checkout

#### `customer-portal`
- **Método**: GET
- **Descrição**: Cria uma sessão do portal de clientes do Stripe
- **Retorno**: URL do portal

#### `stripe-webhook`
- **Método**: POST
- **Descrição**: Processa eventos do webhook do Stripe
- **Retorno**: Confirmação de recebimento

#### `track-usage`
- **Método**: POST
- **Descrição**: Registra o uso de recursos pelos usuários
- **Parâmetros**: `feature_type`, `user_id`
- **Retorno**: Confirmação de registro

## Fluxo de Dados

### Geração de Anúncios
1. Usuário insere informações do produto
2. Frontend envia dados para o backend
3. Backend processa com modelo de IA
4. Resultado é retornado e salvo no histórico

### Diagnóstico de Anúncios
1. Usuário insere texto do anúncio
2. Backend analisa com modelo de IA
3. Relatório de diagnóstico é gerado
4. Sugestões de otimização são apresentadas

### Otimização de Funil
1. Usuário insere texto do anúncio e da página de destino
2. Backend analisa a coerência entre os textos
3. Pontuação de coerência e sugestões são geradas
4. Versão otimizada do anúncio é apresentada

### Assinatura
1. Usuário seleciona plano
2. Frontend inicia checkout via Edge Function
3. Usuário completa pagamento no Stripe
4. Webhook do Stripe notifica o backend
5. Assinatura é ativada no banco de dados

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
| OPENAI_API_KEY | Chave da API da OpenAI (apenas para Edge Functions) | Sim |
| ANTHROPIC_API_KEY | Chave da API da Anthropic (apenas para Edge Functions) | Não |
| NOVITA_API_KEY | Chave da API da Novita (apenas para Edge Functions) | Não |

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

## Limitações Conhecidas e Recursos Pendentes

### Limitações Atuais
1. **Suporte a Idiomas**: Atualmente apenas português do Brasil é suportado
2. **Integração com Plataformas**: Não há integração direta com Facebook Ads, Google Ads, etc.
3. **Análise de Imagens**: O sistema não analisa imagens de anúncios, apenas texto
4. **Modelos de IA**: Alguns modelos avançados podem não estar disponíveis em todos os planos

### Recursos Planejados
1. **Editor Visual de Anúncios**: Interface drag-and-drop para criação de anúncios
2. **Integração com Plataformas**: Facebook Ads, Google Ads, etc.
3. **Análise de Imagens**: Diagnóstico de imagens de anúncios
4. **Multilingue**: Suporte a múltiplos idiomas
5. **API Pública**: Para integração com outras ferramentas

## Instruções de Instalação e Deployment

### Requisitos de Ambiente
- Node.js 18+ 
- npm 9+ ou yarn 1.22+
- Conta no Supabase
- Conta no Stripe (para processamento de pagamentos)
- Contas nos provedores de IA desejados (OpenAI, Anthropic, etc.)

### Instalação Local

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
   OPENAI_API_KEY=sua_chave_da_api_da_openai
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
   supabase functions deploy ad-generator
   supabase functions deploy ad-diagnosis
   supabase functions deploy funnel-optimizer
   supabase functions deploy create-checkout
   supabase functions deploy customer-portal
   supabase functions deploy stripe-webhook
   supabase functions deploy track-usage
   ```

## Solução de Problemas

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

#### Limites de Plano
- Se um usuário não consegue acessar uma funcionalidade, verifique se o plano dele inclui acesso
- Verifique se o usuário atingiu o limite de uso para a funcionalidade
- Consulte a tabela `usage_tracking` para ver o uso atual

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
- Cache de resultados de IA para reduzir custos e melhorar performance
- Estratégia de invalidação de cache baseada em tempo
- Métricas de hit/miss para monitoramento

## Versão e Histórico de Alterações

### Versão Atual: 1.0.0

#### Funcionalidades Implementadas
- ✅ Sistema de autenticação e autorização
- ✅ Gerador de anúncios com IA
- ✅ Diagnóstico de anúncios
- ✅ Laboratório de otimização de funil
- ✅ Histórico de anúncios e diagnósticos
- ✅ Sistema de assinaturas com Stripe
- ✅ Painel administrativo completo
- ✅ Monitoramento de uso de IA
- ✅ Gerenciamento de modelos e provedores de IA
- ✅ Configuração de prompts com versionamento

#### Alterações Recentes
- Adicionado Laboratório de Otimização de Funil
- Implementado sistema de cache para resultados de IA
- Melhorada a validação de entrada nos formulários
- Adicionado suporte a múltiplos provedores de IA
- Implementado sistema de auditoria para ações administrativas
- Corrigidos problemas de performance em listas grandes
- Melhorada a experiência do usuário no painel administrativo
- Adicionadas métricas detalhadas de uso de IA

## Contato e Suporte

- **Email**: contato@otimizaads.com
- **Website**: [www.otimizaads.com](https://www.otimizaads.com)
- **Suporte**: suporte@otimizaads.com

---

Desenvolvido com ❤️ pela equipe OtimizaAds.