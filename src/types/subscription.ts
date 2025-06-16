
import { Database } from '@/integrations/supabase/types';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price_monthly: number;
  currency: string;
  stripe_price_id: string | null;
  features: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan | null;
};

export type UserSubscriptionWithProfile = UserSubscription & {
  profile: {
    email: string;
    full_name: string | null;
  } | null;
};

export type FeatureUsage = {
  current_usage: number;
  limit_value: number;
  can_use: boolean;
};

type SubscriptionMetrics = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
  conversionRate: number;
  ltv: number;
};
