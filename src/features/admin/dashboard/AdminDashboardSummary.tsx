import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardMetrics {
  totalUsers: number;
  totalAds: number;
  adsToday: number;
  adsThisMonth: number;
  newUsersToday: number;
}

interface AdminDashboardSummaryProps {
  metrics: DashboardMetrics;
}

const AdminDashboardSummary = ({ metrics }: AdminDashboardSummaryProps) => {
  return (
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
  );
};

export default AdminDashboardSummary;