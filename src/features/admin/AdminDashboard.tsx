import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminDashboardMetrics from "./dashboard/AdminDashboardMetrics";
import AdminDashboardSummary from "./dashboard/AdminDashboardSummary";

interface DashboardMetrics {
  totalUsers: number;
  totalAds: number;
  adsToday: number;
  adsThisMonth: number;
  newUsersToday: number;
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalAds: 0,
    adsToday: 0,
    adsThisMonth: 0,
    newUsersToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Buscar total de usuários
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Buscar total de anúncios gerados
      const { count: totalAds } = await supabase
        .from('history_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'generation');

      // Buscar anúncios de hoje
      const today = new Date().toISOString().split('T')[0];
      const { count: adsToday } = await supabase
        .from('history_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'generation')
        .gte('created_at', today);

      // Buscar anúncios deste mês
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const { count: adsThisMonth } = await supabase
        .from('history_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'generation')
        .gte('created_at', firstDayOfMonth);

      // Buscar novos usuários hoje
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      setMetrics({
        totalUsers: totalUsers || 0,
        totalAds: totalAds || 0,
        adsToday: adsToday || 0,
        adsThisMonth: adsThisMonth || 0,
        newUsersToday: newUsersToday || 0,
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as métricas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  // A função fetchMetrics é definida no componente e não muda entre renderizações

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-2">
            Visão geral das métricas e estatísticas da plataforma
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline">
          Atualizar Dados
        </Button>
      </div>

      {/* Métricas Principais */}
      <AdminDashboardMetrics metrics={metrics} />

      {/* Cards de Resumo */}
      <AdminDashboardSummary metrics={metrics} />
    </div>
  );
};

export default AdminDashboard;