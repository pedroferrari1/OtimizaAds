import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HealthDashboard } from "@/components/admin/monitoring/HealthDashboard";
import { PerformanceReports } from "@/components/admin/monitoring/PerformanceReports";
import { ErrorLogsViewer } from "@/components/admin/monitoring/ErrorLogsViewer";
import { AIUsageReports } from "@/components/admin/monitoring/AIUsageReports";
import { AlertManager } from "@/components/admin/monitoring/AlertManager";

const AdminMonitoring = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monitoramento e Saúde do Sistema</h1>
        <p className="text-gray-600 mt-2">
          Dashboard completo para monitoramento da aplicação, performance e alertas
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Logs de Erro</TabsTrigger>
          <TabsTrigger value="ai-usage">Uso de IA</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
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

        <TabsContent value="alerts">
          <AlertManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMonitoring;
