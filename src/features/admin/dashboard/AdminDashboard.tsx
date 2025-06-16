import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, FileText, Zap, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
  }, []);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Usuários"
          value={metrics.totalUsers}
          description="Usuários registrados na plataforma"
          icon={Users}
        />
        <MetricCard
          title="Anúncios Gerados"
          value={metrics.totalAds}
          description="Total de anúncios criados"
          icon={FileText}
        />
        <MetricCard
          title="Anúncios Hoje"
          value={metrics.adsToday}
          description="Gerados nas últimas 24h"
          icon={Zap}
        />
        <MetricCard
          title="Novos Usuários"
          value={metrics.newUsersToday}
          description="Cadastros hoje"
          icon={Calendar}
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Mensal</CardTitle>
            <CardDescription>
              Estatísticas do mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Anúncios este mês:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {metrics.adsThisMonth}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Média diária:</span>
                <span className="text-lg font-semibold">
                  {Math.round(metrics.adsThisMonth / new Date().getDate())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status da Plataforma</CardTitle>
            <CardDescription>
              Indicadores de saúde do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Operacional
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Última atualização:</span>
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;