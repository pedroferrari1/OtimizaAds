
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan, UserSubscription, FeatureUsage } from '@/types/subscription';

export const useSubscription = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos.",
        variant: "destructive",
      });
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) {
      setUserSubscription(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
    }
  };

  const checkFeatureUsage = async (feature: string): Promise<FeatureUsage | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('check_feature_usage', {
        user_uuid: user.id,
        feature: feature
      });

      if (error) throw error;
      return data[0] || null;
    } catch (error) {
      console.error('Error checking feature usage:', error);
      return null;
    }
  };

  const canUseFeature = async (feature: string): Promise<boolean> => {
    const usage = await checkFeatureUsage(feature);
    return usage?.can_use || false;
  };

  const incrementUsage = async (feature: string) => {
    if (!user) return;

    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get current usage
      const { data: existingUsage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('feature_type', feature)
        .eq('period_start', periodStart.toISOString())
        .single();

      if (existingUsage) {
        // Update existing record
        await supabase
          .from('usage_tracking')
          .update({ 
            count: existingUsage.count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUsage.id);
      } else {
        // Create new record
        await supabase
          .from('usage_tracking')
          .insert({
            user_id: user.id,
            feature_type: feature,
            count: 1,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString()
          });
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  const createCheckoutSession = async (planId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_id: planId }
      });

      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o checkout.",
        variant: "destructive",
      });
    }
  };

  const manageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPlans(), fetchUserSubscription()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    plans,
    userSubscription,
    loading,
    checkFeatureUsage,
    canUseFeature,
    incrementUsage,
    createCheckoutSession,
    manageSubscription,
    refreshSubscription: fetchUserSubscription
  };
};
