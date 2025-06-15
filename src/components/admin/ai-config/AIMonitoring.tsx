
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const AIMonitoring = () => {
  const [activeTab, setActiveTab] = useState("usage");

  // Fetch AI usage metrics
  const { data: usageMetrics } = useQuery({
    queryKey: ["ai-usage-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_usage_metrics")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch error logs
  const { data: errorLogs } = useQuery({
    queryKey: ["error-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("last_occurrence", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const totalTokens = usageMetrics?.reduce((sum, metric) => 
    sum + (metric.tokens_input || 0) + (metric.tokens_output || 0), 0) || 0;
  
  const totalCost = usageMetrics?.reduce((sum, metric) => 
    sum + (metric.estimated_cost || 0), 0) || 0;
  
  const avgResponseTime = usageMetrics?.length 
    ? usageMetrics.reduce((sum, metric) => sum + (metric.response_time_ms || 0), 0) / usageMetrics.length
    : 0;

  const successRate = usageMetrics?.length 
    ? (usageMetrics.filter(m => m.success).length / usageMetrics.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento de IA</CardTitle>
          <CardDescription>
            Métricas de uso, performance e saúde dos modelos de IA
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="usage">Uso e Custos</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="errors">Erros e Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-6">
              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Últimas 100 requisições
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
                    <p className="text-xs text-muted-foreground">
                      Período atual
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Tempo de resposta
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Requisições bem-sucedidas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Uso Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Tokens In</TableHead>
                        <TableHead>Tokens Out</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageMetrics?.slice(0, 10).map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell className="font-medium">{metric.model_name}</TableCell>
                          <TableCell>{metric.service_type}</TableCell>
                          <TableCell>{metric.tokens_input || 0}</TableCell>
                          <TableCell>{metric.tokens_output || 0}</TableCell>
                          <TableCell>${(metric.estimated_cost || 0).toFixed(4)}</TableCell>
                          <TableCell>{metric.response_time_ms || 0}ms</TableCell>
                          <TableCell>
                            {metric.success ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sucesso
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Erro
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(metric.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance por Modelo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(
                        usageMetrics?.reduce((acc, metric) => {
                          const model = metric.model_name;
                          if (!acc[model]) {
                            acc[model] = { count: 0, totalTime: 0, success: 0 };
                          }
                          acc[model].count++;
                          acc[model].totalTime += metric.response_time_ms || 0;
                          if (metric.success) acc[model].success++;
                          return acc;
                        }, {} as Record<string, { count: number; totalTime: number; success: number }>) || {}
                      ).map(([model, stats]) => (
                        <div key={model} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{model}</p>
                            <p className="text-sm text-gray-600">
                              {stats.count} requisições
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {(stats.totalTime / stats.count).toFixed(0)}ms
                            </p>
                            <p className="text-sm text-gray-600">
                              {((stats.success / stats.count) * 100).toFixed(1)}% sucesso
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição de Custos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(
                        usageMetrics?.reduce((acc, metric) => {
                          const model = metric.model_name;
                          if (!acc[model]) {
                            acc[model] = 0;
                          }
                          acc[model] += metric.estimated_cost || 0;
                          return acc;
                        }, {} as Record<string, number>) || {}
                      )
                      .sort(([,a], [,b]) => b - a)
                      .map(([model, cost]) => (
                        <div key={model} className="flex items-center justify-between p-3 border rounded">
                          <p className="font-medium">{model}</p>
                          <p className="font-semibold">${cost.toFixed(4)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="errors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Erro Recentes</CardTitle>
                  <CardDescription>
                    Erros e problemas detectados no sistema de IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Frequência</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Ocorrência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorLogs?.map((error) => (
                        <TableRow key={error.id}>
                          <TableCell>
                            <Badge variant="outline">{error.error_type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {error.error_message}
                          </TableCell>
                          <TableCell>{error.endpoint || "N/A"}</TableCell>
                          <TableCell>{error.frequency || 1}</TableCell>
                          <TableCell>
                            {error.resolved ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Resolvido
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(error.last_occurrence), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
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
