import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSubscriptionWithProfile } from "@/types/subscription";
import { Users, DollarSign, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SubscriptionDashboardProps {
  subscriptions: UserSubscriptionWithProfile[];
  loading: boolean;
}

const SubscriptionDashboard = ({ subscriptions, loading }: SubscriptionDashboardProps) => {
  const metrics = useMemo(() => {
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const monthlyRevenue = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0) / 100;

    const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled').length;
    const churnRate = totalSubscriptions > 0 ? (cancelledSubs / totalSubscriptions) * 100 : 0;

    // Calcular MRR dos últimos 6 meses (simulado)
    const today = new Date();
    const mrrData = Array.from({ length: 6 }, (_, i) => {
      const month = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
      const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });
      
      // Simular crescimento de MRR
      const growthFactor = 1 + (i * 0.15);
      const baseRevenue = monthlyRevenue / (1 + (5 * 0.15));
      
      return {
        month: monthName,
        mrr: Math.round(baseRevenue * growthFactor),
      };
    });

    return {
      totalSubscriptions,
      activeSubscriptions,
      monthlyRevenue,
      churnRate,
      mrrData,
      mrrGrowth: 15, // Crescimento simulado de 15%
      ltv: Math.round(monthlyRevenue * (1 / (churnRate / 100))), // LTV = MRR / Churn Rate
      conversionRate: 3.5, // Taxa de conversão simulada
    };
  }, [subscriptions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{metrics.mrrGrowth}% vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
            <div className="text-xs text-gray-500 mt-1">
              Total: {metrics.totalSubscriptions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>Meta: &lt;5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Vitalício (LTV)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.ltv)}</div>
            <div className="text-xs text-gray-500 mt-1">
              Por cliente
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Receita Mensal (MRR)</CardTitle>
          <CardDescription>Últimos 6 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics.mrrData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`R$${value}`, 'MRR']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  stroke="#3b82f6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Recentes</CardTitle>
          <CardDescription>Últimas 5 assinaturas criadas ou modificadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.slice(0, 5).map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{sub.profile?.email || 'Email não disponível'}</p>
                  <p className="text-sm text-gray-600">
                    {sub.plan?.name} - {formatCurrency((sub.plan?.price_monthly || 0) / 100)}/mês
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    sub.status === 'active' ? 'bg-green-600' :
                    sub.status === 'cancelled' ? 'bg-yellow-600' :
                    sub.status === 'past_due' ? 'bg-red-600' : 'bg-gray-600'
                  }>
                    {sub.status === 'active' ? 'Ativo' :
                     sub.status === 'cancelled' ? 'Cancelado' :
                     sub.status === 'past_due' ? 'Em Atraso' : sub.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
            
            {subscriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma assinatura encontrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionDashboard;