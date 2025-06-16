import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserSubscriptionWithProfile } from "@/types/subscription";
import SubscriptionDashboard from "./components/SubscriptionDashboard";
import SubscriptionPlansManager from "./components/SubscriptionPlansManager";
import SubscribersList from "./components/SubscribersList";
import StripeIntegration from "./components/StripeIntegration";
import ReportsAndMetrics from "./components/ReportsAndMetrics";

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*),
          profiles(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const transformedData = (data || []).map(item => ({
        ...item,
        profile: item.profiles ? {
          email: item.profiles.email,
          full_name: item.profiles.full_name
        } : null
      })) as UserSubscriptionWithProfile[];
      
      setSubscriptions(transformedData);
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  // A função fetchSubscriptions é definida no componente e não muda entre renderizações

  const handleRefresh = () => {
    fetchSubscriptions();
    toast({
      title: "Dados atualizados",
      description: "As informações de assinaturas foram atualizadas com sucesso."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Assinaturas</h1>
          <p className="text-gray-600 mt-2">
            Administre planos, assinaturas, integrações e métricas de receita
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar Dados"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="subscribers">Assinantes</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SubscriptionDashboard subscriptions={subscriptions} loading={loading} />
        </TabsContent>

        <TabsContent value="plans">
          <SubscriptionPlansManager onPlanUpdated={handleRefresh} />
        </TabsContent>

        <TabsContent value="subscribers">
          <SubscribersList subscriptions={subscriptions} loading={loading} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="integration">
          <StripeIntegration />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsAndMetrics subscriptions={subscriptions} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptions;