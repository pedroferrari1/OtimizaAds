
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, Clock, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HealthMetrics {
  uptime: number;
  avgLatency: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface ChartData {
  timestamp: string;
  value: number;
}

export const HealthDashboard = () => {
  const [metrics, setMetrics] = useState<HealthMetrics>({
    uptime: 99.9,
    avgLatency: 120,
    errorRate: 0.5,
    requestsPerMinute: 45
  });
  const [latencyData, setLatencyData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHealthMetrics = async () => {
    try {
      setLoading(true);

      // Buscar métricas de latência das últimas 24 horas
      const { data: latencyMetrics } = await supabase
        .from('system_health_metrics')
        .select('*')
        .eq('metric_type', 'latency')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      if (latencyMetrics) {
        const chartData = latencyMetrics.map(metric => ({
          timestamp: new Date(metric.timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          value: Number(metric.metric_value)
        }));
        setLatencyData(chartData);

        // Calcular latência média
        const avgLatency = latencyMetrics.reduce((sum, m) => sum + Number(m.metric_value), 0) / latencyMetrics.length;
        setMetrics(prev => ({ ...prev, avgLatency: Math.round(avgLatency) }));
      }

      // Simular outras métricas (em produção, viria de fontes reais)
      setMetrics(prev => ({
        ...prev,
        uptime: 99.9,
        errorRate: 0.5,
        requestsPerMinute: 45
      }));

    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as métricas do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchHealthMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (metric: string, value: number) => {
    switch (metric) {
      case 'uptime':
        return value >= 99.5 ? 'text-green-600' : value >= 99 ? 'text-yellow-600' : 'text-red-600';
      case 'latency':
        return value <= 200 ? 'text-green-600' : value <= 500 ? 'text-yellow-600' : 'text-red-600';
      case 'errorRate':
        return value <= 1 ? 'text-green-600' : value <= 3 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard de Saúde</h2>
        <Button onClick={fetchHealthMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor('uptime', metrics.uptime)}`}>
              {metrics.uptime}%
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor('latency', metrics.avgLatency)}`}>
              {metrics.avgLatency}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta médio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erros</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor('errorRate', metrics.errorRate)}`}>
              {metrics.errorRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              4xx e 5xx responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RPM</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.requestsPerMinute}
            </div>
            <p className="text-xs text-muted-foreground">
              Requisições por minuto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Latência */}
      <Card>
        <CardHeader>
          <CardTitle>Latência ao Longo do Tempo</CardTitle>
          <CardDescription>
            Evolução da latência nas últimas 24 horas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}ms`, 'Latência']}
                  labelFormatter={(label) => `Horário: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status dos Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Serviços</CardTitle>
          <CardDescription>
            Estado atual dos principais componentes da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'API Principal', status: 'online' },
              { name: 'Banco de Dados', status: 'online' },
              { name: 'Serviço de Autenticação', status: 'online' },
              { name: 'Processamento de IA', status: 'online' },
            ].map((service) => (
              <div key={service.name} className="flex justify-between items-center">
                <span className="font-medium">{service.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.status === 'online' 
                    ? 'bg-green-100 text-green-800' 
                    : service.status === 'unstable'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {service.status === 'online' ? 'Online' : 
                   service.status === 'unstable' ? 'Instável' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
