import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import MetricsOverview from "@/features/admin/monitoring/components/MetricsOverview";
import RecentActivityTable from "@/features/admin/monitoring/components/RecentActivityTable";

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

  // Calculate metrics
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
              <TabsTrigger value="usage">Visão Geral</TabsTrigger>
              <TabsTrigger value="models">Por Modelo</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-6">
              {/* Metrics Overview Component */}
              <MetricsOverview metrics={metrics} />

              {/* Recent Activity Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivityTable usageMetrics={usageMetrics || []} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outras abas mantidas como estavam */}
            <TabsContent value="models" className="space-y-6">
              {/* Conteúdo da aba de modelos */}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Conteúdo da aba de performance */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};