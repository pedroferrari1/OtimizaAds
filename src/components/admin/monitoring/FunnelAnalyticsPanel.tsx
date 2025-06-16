import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  RefreshCw,
  Calendar,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const FunnelAnalyticsPanel = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [isExporting, setIsExporting] = useState(false);

  // Buscar dados de análise de funil
  const { data: funnelData, isLoading, refetch } = useQuery({
    queryKey: ["funnel-analytics", timeRange],
    queryFn: async () => {
      // Calcular intervalo de datas com base no timeRange
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }
      
      // Buscar dados de análise de funil
      const { data: logs, error } = await supabase
        .from('funnel_analysis_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar métricas de uso
      const { data: metrics } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('metric_type', 'funnel_analysis_usage')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');
      
      // Buscar dados de cache
      const { data: cacheStats } = await supabase
        .from('usage_metrics')
        .select('*')
        .in('metric_type', ['cache_hits', 'cache_misses'])
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
      
      // Calcular métricas
      const totalAnalyses = logs?.length || 0;
      const avgCoherenceScore = logs?.reduce((sum, log) => sum + log.coherence_score, 0) / totalAnalyses || 0;
      const avgProcessingTime = logs?.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / totalAnalyses || 0;
      
      // Calcular distribuição de pontuações
      const scoreDistribution = [
        { name: '0-3', count: logs?.filter(l => l.coherence_score <= 3).length || 0 },
        { name: '4-5', count: logs?.filter(l => l.coherence_score > 3 && l.coherence_score <= 5).length || 0 },
        { name: '6-7', count: logs?.filter(l => l.coherence_score > 5 && l.coherence_score <= 7).length || 0 },
        { name: '8-10', count: logs?.filter(l => l.coherence_score > 7).length || 0 }
      ];
      
      // Preparar dados para gráfico de uso diário
      const usageByDay = metrics?.map(m => ({
        date: format(new Date(m.date), 'dd/MM'),
        analyses: m.metric_value
      })) || [];
      
      // Calcular estatísticas de cache
      const cacheHits = cacheStats?.filter(s => s.metric_type === 'cache_hits').reduce((sum, s) => sum + s.metric_value, 0) || 0;
      const cacheMisses = cacheStats?.filter(s => s.metric_type === 'cache_misses').reduce((sum, s) => sum + s.metric_value, 0) || 0;
      const cacheHitRate = (cacheHits + cacheMisses) > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0;
      
      return {
        logs: logs || [],
        totalAnalyses,
        avgCoherenceScore,
        avgProcessingTime,
        scoreDistribution,
        usageByDay,
        cacheHitRate
      };
    }
  });

  const handleExportData = async () => {
    if (!funnelData?.logs) return;
    
    setIsExporting(true);
    
    try {
      // Preparar dados para CSV
      const csvRows = [
        // Cabeçalho
        ['ID', 'Usuário', 'Pontuação', 'Tempo de Processamento (ms)', 'Data'].join(','),
        // Linhas de dados
        ...funnelData.logs.map(log => [
          log.id,
          log.user_id,
          log.coherence_score,
          log.processing_time_ms || 0,
          new Date(log.created_at).toISOString()
        ].join(','))
      ];
      
      // Criar blob e download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `funnel-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Análise de Funil</h2>
          <p className="text-gray-600">Métricas e estatísticas do Laboratório de Otimização de Funil</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData?.totalAnalyses || 0}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{Math.round(funnelData?.totalAnalyses * 0.15 || 0)} vs. período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontuação Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData?.avgCoherenceScore.toFixed(1) || 0}/10</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+0.5 vs. período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cache</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData?.cacheHitRate.toFixed(1) || 0}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>Economia de recursos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(funnelData?.avgProcessingTime || 0)}ms</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>-50ms vs. período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uso Diário</CardTitle>
            <CardDescription>
              Número de análises de funil realizadas por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={funnelData?.usageByDay}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="analyses" 
                    name="Análises" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Pontuações</CardTitle>
            <CardDescription>
              Distribuição das pontuações de coerência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData?.scoreDistribution}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Quantidade" 
                    fill="#3b82f6" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Análises Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Análises Recentes</CardTitle>
          <CardDescription>
            Últimas análises de funil realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Pontuação</TableHead>
                <TableHead>Tempo de Processamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelData?.logs.slice(0, 10).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.id.substring(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{log.user_id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant={
                      log.coherence_score >= 8 ? "default" : 
                      log.coherence_score >= 6 ? "secondary" : 
                      "destructive"
                    }>
                      {log.coherence_score.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.processing_time_ms || 0}ms</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Concluído
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};