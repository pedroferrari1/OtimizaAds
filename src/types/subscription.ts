import { Database } from '@/integrations/supabase/types';

/**
 * Interface para plano de assinatura
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  currency: string;
  stripe_price_id: string | null;
  features: SubscriptionFeatures;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
}

/**
 * Interface para recursos incluídos em um plano
 */
export interface SubscriptionFeatures {
  generations?: number;
  diagnostics?: number;
  funnel_analysis?: number;
  models?: 'basic' | 'standard' | 'premium' | 'all';
  support?: 'email' | 'priority' | 'dedicated';
  trial_days?: number;
  optimization?: boolean;
  performance_analysis?: boolean;
  competitor_analysis?: boolean;
  premium_templates?: boolean;
  detailed_reports?: boolean;
  priority_support?: boolean;
  unlimited_generations?: boolean;
  unlimited_diagnostics?: boolean;
  custom_ai?: boolean;
  multiple_accounts?: boolean;
  api_access?: boolean;
  dedicated_support?: boolean;
  custom_training?: boolean;
  [key: string]: any;
}

/**
 * Interface para assinatura de usuário
 */
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan | null;
}

/**
 * Tipo para status de assinatura
 */
export type SubscriptionStatus = 
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

/**
 * Interface para assinatura com dados de perfil
 */
export interface UserSubscriptionWithProfile extends UserSubscription {
  profile: {
    email: string;
    full_name: string | null;
  } | null;
}

/**
 * Interface para uso de funcionalidade
 */
export interface FeatureUsage {
  current_usage: number;
  limit_value: number;
  can_use: boolean;
}

/**
 * Interface para método de pagamento
 */
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

/**
 * Interface para evento de assinatura
 */
export interface SubscriptionEvent {
  id: string;
  action: string;
  details: any;
  created_at: string;
}