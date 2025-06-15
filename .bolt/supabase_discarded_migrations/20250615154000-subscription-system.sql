
-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price_monthly INTEGER NOT NULL, -- price in cents
  currency TEXT NOT NULL DEFAULT 'BRL',
  stripe_price_id TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price_monthly, features) VALUES
('Gratuito', 0, '{
  "generations": 5,
  "diagnostics": 3,
  "models": "basic",
  "support": "email",
  "optimization": false,
  "performance_analysis": false,
  "competitor_analysis": false,
  "premium_templates": false,
  "detailed_reports": false,
  "priority_support": false,
  "unlimited_generations": false,
  "unlimited_diagnostics": false,
  "custom_ai": false,
  "multiple_accounts": false,
  "api_access": false,
  "dedicated_support": false,
  "custom_training": false
}'),
('Básico', 2900, '{
  "generations": 50,
  "diagnostics": 25,
  "models": "all",
  "support": "email",
  "optimization": true,
  "performance_analysis": true,
  "competitor_analysis": false,
  "premium_templates": false,
  "detailed_reports": false,
  "priority_support": false,
  "unlimited_generations": false,
  "unlimited_diagnostics": false,
  "custom_ai": false,
  "multiple_accounts": false,
  "api_access": false,
  "dedicated_support": false,
  "custom_training": false
}'),
('Intermediário', 5900, '{
  "generations": 150,
  "diagnostics": 75,
  "models": "all",
  "support": "priority",
  "optimization": true,
  "performance_analysis": true,
  "competitor_analysis": true,
  "premium_templates": true,
  "detailed_reports": true,
  "priority_support": true,
  "unlimited_generations": false,
  "unlimited_diagnostics": false,
  "custom_ai": false,
  "multiple_accounts": false,
  "api_access": false,
  "dedicated_support": false,
  "custom_training": false
}'),
('Premium', 9900, '{
  "generations": -1,
  "diagnostics": -1,
  "models": "all",
  "support": "dedicated",
  "optimization": true,
  "performance_analysis": true,
  "competitor_analysis": true,
  "premium_templates": true,
  "detailed_reports": true,
  "priority_support": true,
  "unlimited_generations": true,
  "unlimited_diagnostics": true,
  "custom_ai": true,
  "multiple_accounts": true,
  "api_access": true,
  "dedicated_support": true,
  "custom_training": true
}');

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, past_due
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage_tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL, -- 'generation', 'diagnostic'
  count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_type, period_start)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "subscription_plans_select" ON public.subscription_plans
  FOR SELECT USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "user_subscriptions_select" ON public.user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_subscriptions_insert" ON public.user_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_subscriptions_update" ON public.user_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for usage_tracking
CREATE POLICY "usage_tracking_select" ON public.usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "usage_tracking_insert" ON public.usage_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "usage_tracking_update" ON public.usage_tracking
  FOR UPDATE USING (user_id = auth.uid());

-- Admin policies (bypass RLS with service role)
CREATE POLICY "admin_full_access_subscriptions" ON public.user_subscriptions
  FOR ALL USING (true);

CREATE POLICY "admin_full_access_usage" ON public.usage_tracking
  FOR ALL USING (true);

CREATE POLICY "admin_full_access_plans" ON public.subscription_plans
  FOR ALL USING (true);

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  plan_name TEXT,
  features JSONB,
  status TEXT,
  current_period_end TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    sp.name,
    sp.features,
    us.status,
    us.current_period_end
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
  AND us.status = 'active';
$$;

-- Function to check feature usage
CREATE OR REPLACE FUNCTION check_feature_usage(user_uuid UUID, feature TEXT)
RETURNS TABLE (
  current_usage INTEGER,
  limit_value INTEGER,
  can_use BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan RECORD;
  current_count INTEGER := 0;
  feature_limit INTEGER := 0;
BEGIN
  -- Get user's current plan
  SELECT sp.features INTO user_plan
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid AND us.status = 'active';
  
  IF user_plan IS NULL THEN
    -- User has no active subscription, default to free plan limits
    SELECT features INTO user_plan FROM subscription_plans WHERE name = 'Gratuito';
  END IF;
  
  -- Get feature limit from plan
  feature_limit := (user_plan.features ->> feature)::INTEGER;
  
  -- If unlimited (-1), return early
  IF feature_limit = -1 THEN
    RETURN QUERY SELECT 0, -1, true;
    RETURN;
  END IF;
  
  -- Get current usage for this month
  SELECT COALESCE(ut.count, 0) INTO current_count
  FROM usage_tracking ut
  WHERE ut.user_id = user_uuid 
    AND ut.feature_type = feature
    AND ut.period_start <= NOW()
    AND ut.period_end > NOW();
  
  RETURN QUERY SELECT 
    current_count,
    feature_limit,
    (current_count < feature_limit);
END;
$$;
