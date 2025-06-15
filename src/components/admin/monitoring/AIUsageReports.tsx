import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Clock,
  Download,
  Calendar,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type AIUsageMetric = Tables<"ai_usage_metrics">;

export const AIUsageReports = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedModel, setSelectedModel] = useState("");

  // Calculate date range based on selection
  const getDateRange = () => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 
      timeRange === "1d" ? 1 :
      timeRange === "7d" ? 7 :
      timeRange === "30d" ? 30 : 90
    ));
    return { start, end };
  };

  // Fetch AI usage metrics
  const { data: usageMetrics, isLoading } = useQuery({
    queryKey: ["ai-usage-reports", timeRange, selectedModel],
    queryFn: async (): Promise<AIUsageMetric[]> => {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from("ai_usage_metrics")
        .select("*")
        .gte("timestamp", start.toISOString())
        .lte("timestamp", end.toISOString())
        .order("timestamp", { ascending: false });

      if (selectedModel) {
        query = query.eq("model_name", selectedModel);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate aggregated metrics
  const metrics = usageMetrics ? {
    totalRequests: usageMetrics.length,
    totalTokensInput: usageMetrics.reduce((sum, m) => sum + (m.tokens_input || 0), 0),
    totalTokensOutput: usageMetrics.reduce((sum, m) => sum + (m.tokens_output || 0), 0),
    totalCost: usageMetrics.reduce((sum, m) => sum + (m.estimated_cost || 0), 0),
    avgResponseTime: usageMetrics.length > 0 
      ? usageMetrics.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / usageMetrics.length 
      : 0,
    successRate: usageMetrics.length > 0 
      ? (usageMetrics.filter(m => m.success).length / usageMetrics.length) * 100 
      : 0,
  } : {
    totalRequests: 0,
    totalTokensInput: 0,
    totalTokensOutput: 0,
    totalCost: 0,
    avgResponseTime: 0,
    successRate: 0,
  };

  // Group by model for analysis
  const modelStats = usageMetrics?.reduce((acc, metric) => {
    const model = metric.model_name;
    if (!acc[model]) {
      acc[model] = {
        requests: 0,
        tokensInput: 0,
        tokensOutput: 0,
        cost: 0,
        responseTime: 0,
        successCount: 0,
      };
    }
    
    acc[model].requests++;
    acc[model].tokensInput += metric.tokens_input || 0;
    acc[model].tokensOutput += metric.tokens_output || 0;
    acc[model].cost += metric.estimated_cost || 0;
    acc[model].responseTime += metric.response_time_ms || 0;
    if (metric.success) acc[model].successCount++;
    
    return acc;
  }, {} as Record<string, any>) || {};

  // Get unique models for filter
  const models = [...new Set(usageMetrics?.map(m => m.model_name) || [])];

  const exportReport = () => {
    if (!usageMetrics) return;

    const csvContent = [
      ["Timestamp", "Modelo", "Serviço", "Tokens Input", "Tokens Output", "Custo", "Tempo (ms)", "Sucesso"].join(","),
      ...usageMetrics.map(metric => [
        metric.timestamp,
        metric.model_name,
        metric.service_type,
        metric.tokens_input || 0,
        metric.tokens_output || 0,
        metric.estimated_cost || 0,
        metric.response_time_ms || 0,
        metric.success ? "Sim" : "Não"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-usage-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Uso de IA</CardTitle>
          <CardDescription>
            Análise detalhada de métricas, custos e performance dos modelos de IA
          </CardDescription>
          
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Último dia</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os modelos</SelectItem>
                {models.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="models">Por Modelo</TabsTrigger>
              <TabsTrigger value="costs">Análise de Custos</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Requisições</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tokens Input</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalTokensInput.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tokens Output</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalTokensOutput.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${metrics.totalCost.toFixed(4)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa Sucesso</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageMetrics?.slice(0, 10).map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell>
                            {format(new Date(metric.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium">{metric.model_name}</TableCell>
                          <TableCell>{metric.service_type}</TableCell>
                          <TableCell>
                            {((metric.tokens_input || 0) + (metric.tokens_output || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell>${(metric.estimated_cost || 0).toFixed(4)}</TableCell>
                          <TableCell>{metric.response_time_ms || 0}ms</TableCell>
                          <TableCell>
                            <Badge variant={metric.success ? "default" : "destructive"}>
                              {metric.success ? "Sucesso" : "Erro"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="models" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas por Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Requisições</TableHead>
                        <TableHead>Tokens Total</TableHead>
                        <TableHead>Custo Total</TableHead>
                        <TableHead>Tempo Médio</TableHead>
                        <TableHead>Taxa Sucesso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(modelStats).map(([model, stats]) => (
                        <TableRow key={model}>
                          <TableCell className="font-medium">{model}</TableCell>
                          <TableCell>{stats.requests.toLocaleString()}</TableCell>
                          <TableCell>
                            {(stats.tokensInput + stats.tokensOutput).toLocaleString()}
                          </TableCell>
                          <TableCell>${stats.cost.toFixed(4)}</TableCell>
                          <TableCell>
                            {(stats.responseTime / stats.requests).toFixed(0)}ms
                          </TableCell>
                          <TableCell>
                            <Badge variant={((stats.successCount / stats.requests) * 100) > 95 ? "default" : "secondary"}>
                              {((stats.successCount / stats.requests) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Custos por Modelo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(modelStats)
                        .sort(([,a], [,b]) => b.cost - a.cost)
                        .map(([model, stats]) => (
                        <div key={model} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{model}</p>
                            <p className="text-sm text-gray-600">
                              {stats.requests} requisições
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${stats.cost.toFixed(4)}</p>
                            <p className="text-sm text-gray-600">
                              ${(stats.cost / stats.requests).toFixed(6)}/req
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Eficiência de Custo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(modelStats)
                        .sort(([,a], [,b]) => 
                          (a.cost / (a.tokensInput + a.tokensOutput)) - 
                          (b.cost / (b.tokensInput + b.tokensOutput))
                        )
                        .map(([model, stats]) => {
                          const costPerToken = stats.cost / (stats.tokensInput + stats.tokensOutput);
                          return (
                            <div key={model} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <p className="font-medium">{model}</p>
                                <p className="text-sm text-gray-600">
                                  {(stats.tokensInput + stats.tokensOutput).toLocaleString()} tokens
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">
                                  ${(costPerToken * 1000).toFixed(6)}/1K tokens
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Tempo Médio</TableHead>
                        <TableHead>Tempo Mínimo</TableHead>
                        <TableHead>Tempo Máximo</TableHead>
                        <TableHead>Taxa de Sucesso</TableHead>
                        <TableHead>Throughput</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(modelStats).map(([model, stats]) => {
                        const modelMetrics = usageMetrics?.filter(m => m.model_name === model) || [];
                        const responseTimes = modelMetrics.map(m => m.response_time_ms || 0).filter(t => t > 0);
                        const minTime = Math.min(...responseTimes);
                        const maxTime = Math.max(...responseTimes);
                        const avgTime = stats.responseTime / stats.requests;
                        
                        return (
                          <TableRow key={model}>
                            <TableCell className="font-medium">{model}</TableCell>
                            <TableCell>{avgTime.toFixed(0)}ms</TableCell>
                            <TableCell>{isFinite(minTime) ? minTime : 0}ms</TableCell>
                            <TableCell>{isFinite(maxTime) ? maxTime : 0}ms</TableCell>
                            <TableCell>
                              <Badge variant={((stats.successCount / stats.requests) * 100) > 95 ? "default" : "secondary"}>
                                {((stats.successCount / stats.requests) * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {(stats.requests / (timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 30)).toFixed(1)} req/dia
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
