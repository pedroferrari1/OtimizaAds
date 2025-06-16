import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, FileText, Zap, Calendar } from "lucide-react";

interface DashboardMetrics {
  totalUsers: number;
  totalAds: number;
  adsToday: number;
  adsThisMonth: number;
  newUsersToday: number;
}

interface AdminDashboardMetricsProps {
  metrics: DashboardMetrics;
}

const AdminDashboardMetrics = ({ metrics }: AdminDashboardMetricsProps) => {
  return (
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
  );
};

export default AdminDashboardMetrics;