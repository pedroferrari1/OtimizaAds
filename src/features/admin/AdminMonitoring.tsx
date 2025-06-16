import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { HealthDashboard } from "@/components/admin/monitoring/HealthDashboard";
import { PerformanceReports } from "@/components/admin/monitoring/PerformanceReports";
import { ErrorLogsViewer } from "@/components/admin/monitoring/ErrorLogsViewer";
import { AIUsageReports } from "@/components/admin/monitoring/AIUsageReports";
import { AlertManager } from "@/components/admin/monitoring/AlertManager";
import { FunnelAnalyticsPanel } from "@/components/admin/monitoring/FunnelAnalyticsPanel";
import { SystemHealthConfig } from "@/components/admin/monitoring/SystemHealthConfig";
import { RefreshCw } from "lucide-react";

const AdminMonitoring = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Simular atualização de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Dados atualizados",
        description: "Os dados de monitoramento foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados de monitoramento.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoramento e Saúde do Sistema</h1>
          <p className="text-gray-600 mt-2">
            Dashboard completo para monitoramento da aplicação, performance e alertas
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </div>

      <Tabs 
        defaultValue="dashboard" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Logs de Erro</TabsTrigger>
          <TabsTrigger value="ai-usage">Uso de IA</TabsTrigger>
          <TabsTrigger value="funnel">Análise de Funil</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <HealthDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceReports />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorLogsViewer />
        </TabsContent>

        <TabsContent value="ai-usage">
          <AIUsageReports />
        </TabsContent>

        <TabsContent value="funnel">
          <FunnelAnalyticsPanel />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertManager />
        </TabsContent>
        
        <TabsContent value="config">
          <SystemHealthConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMonitoring;
