# Estrutura do Projeto OtimizaAds

## Visão Geral

Este documento descreve a estrutura de organização do projeto OtimizaAds, uma plataforma de inteligência artificial para criação, diagnóstico e otimização de anúncios.

## Estrutura de Diretórios

```
/
├── src/                         # Código-fonte principal
│   ├── components/              # Componentes React reutilizáveis
│   │   ├── admin/               # Componentes específicos para administração
│   │   ├── diagnosis/           # Componentes para diagnóstico de anúncios
│   │   ├── funnel-optimizer/    # Componentes para otimização de funil
│   │   ├── layout/              # Componentes de layout
│   │   ├── subscription/        # Componentes de assinatura
│   │   └── ui/                  # Componentes de UI básicos (shadcn)
│   │
│   ├── core/                    # Utilitários centrais
│   │   └── utils/               # Funções utilitárias
│   │
│   ├── features/                # Módulos de funcionalidades principais
│   │   ├── admin/               # Funcionalidades administrativas
│   │   │   ├── dashboard/       # Dashboard administrativo
│   │   │   ├── monitoring/      # Monitoramento do sistema
│   │   │   ├── subscriptions/   # Gestão de assinaturas
│   │   │   └── index.ts         # Exportações para módulo admin
│   │   │
│   │   ├── ads/                 # Funcionalidades de anúncios
│   │   │   ├── diagnosis/       # Diagnóstico de anúncios
│   │   │   ├── generator/       # Gerador de anúncios
│   │   │   ├── hooks/           # Hooks específicos para anúncios
│   │   │   └── index.ts         # Exportações para módulo ads
│   │   │
│   │   ├── auth/                # Autenticação e autorização
│   │   │   ├── components/      # Componentes de autenticação
│   │   │   ├── context/         # Contexto de autenticação
│   │   │   └── index.ts         # Exportações para módulo auth
│   │   │
│   │   ├── dashboard/           # Dashboard do usuário
│   │   ├── history/             # Histórico de anúncios
│   │   ├── landing/             # Página inicial
│   │   │   ├── components/      # Componentes da landing page
│   │   │   └── index.ts         # Exportações para módulo landing
│   │   │
│   │   └── subscription/        # Gerenciamento de assinaturas
│   │       ├── components/      # Componentes de assinatura
│   │       └── index.ts         # Exportações para o módulo
│   │
│   ├── hooks/                   # Hooks React personalizados
│   │   ├── use-toast.ts         # Hook para notificações toast
│   │   ├── useSubscription.ts   # Hook para gerenciamento de assinaturas
│   │   └── useFunnelOptimizer.ts # Hook para otimização de funil
│   │
│   ├── integrations/            # Integrações com serviços externos
│   │   └── supabase/            # Cliente e tipos do Supabase
│   │
│   ├── lib/                     # Bibliotecas e utilitários
│   │   └── utils.ts             # Funções utilitárias genéricas
│   │
│   ├── pages/                   # Páginas da aplicação
│   │   ├── app/                 # Páginas da área logada
│   │   └── Index.tsx            # Página inicial
│   │
│   ├── types/                   # Definições de tipos TypeScript
│   │   ├── funnel-optimizer.ts  # Tipos para otimização de funil
│   │   ├── provider-config.ts   # Tipos para configurações de provedor
│   │   └── subscription.ts      # Tipos para assinaturas
│   │
│   ├── App.tsx                  # Componente principal da aplicação
│   ├── App.css                  # Estilos globais da aplicação
│   ├── index.css                # Estilos globais
│   ├── main.tsx                 # Ponto de entrada principal
│   └── stripe-config.ts         # Configurações do Stripe
│
├── supabase/                    # Configurações do Supabase
│   ├── functions/               # Edge Functions do Supabase
│   └── migrations/              # Migrações do banco de dados
│
├── public/                      # Arquivos estáticos
├── index.html                   # Arquivo HTML principal
└── vite.config.ts               # Configuração do Vite
```

## Principais Módulos e Suas Responsabilidades

### `/components`

Componentes React reutilizáveis organizados por domínio:

- **admin**: Componentes específicos para o painel administrativo
- **diagnosis**: Componentes para diagnóstico de anúncios
- **ui**: Componentes básicos de UI baseados em shadcn/ui

### `/features`

Módulos de funcionalidades principais organizados por domínio:

- **admin**: Funcionalidades administrativas (dashboard, usuários, configurações)
- **ads**: Funcionalidades relacionadas a anúncios (geração, diagnóstico)
- **auth**: Autenticação e autorização (login, registro, proteção de rotas)
- **subscription**: Gerenciamento de assinaturas

### `/hooks`

Hooks React personalizados para lógica reutilizável:

- **use-toast**: Hook para notificações toast
- **useSubscription**: Hook para gerenciamento de assinaturas
- **useFunnelOptimizer**: Hook para otimização de funil

### `/integrations`

Integrações com serviços externos:

- **supabase**: Cliente Supabase e tipos gerados

### `/types`

Definições de tipos TypeScript para os diferentes módulos do sistema.

## Convenções de Nomenclatura

- **Componentes React**: PascalCase (ex: `SubscriptionPlans.tsx`)
- **Hooks**: camelCase com prefixo "use" (ex: `useSubscription.ts`)
- **Utilitários e Helpers**: camelCase (ex: `utils.ts`)
- **Tipos**: PascalCase (ex: `SubscriptionPlan`)

## Padrões de Módulos

Cada módulo de feature segue uma estrutura semelhante:

1. **Componentes**: Específicos para a feature
2. **Hooks**: Lógica de estado e efeitos
3. **Serviços**: Lógica de negócio e API
4. **Arquivo de índice**: Exportações centralizadas

## Fluxo de Dados

A aplicação segue um fluxo de dados unidirecional:

1. **Estado Global**: Gerenciado por contextos React (AuthContext)
2. **Estado Local**: Gerenciado por hooks personalizados (useState, useAdGenerator)
3. **Persistência**: Gerenciada pelo cliente Supabase