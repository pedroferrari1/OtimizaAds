@@ .. @@
import { HealthDashboard } from "@/components/admin/monitoring/HealthDashboard";
import { PerformanceReports } from "@/components/admin/monitoring/PerformanceReports";
import { ErrorLogsViewer } from "@/components/admin/monitoring/ErrorLogsViewer";
import { AIUsageReports } from "@/components/admin/monitoring/AIUsageReports";
import { AlertManager } from "@/components/admin/monitoring/AlertManager";
+import { FunnelAnalyticsPanel } from "@/components/admin/monitoring/FunnelAnalyticsPanel";
import { RefreshCw } from "lucide-react";

const AdminMonitoring = () => {
@@ .. @@
      </div>

      <Tabs 
        defaultValue="dashboard" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
-        <TabsList className="grid w-full grid-cols-5">
+        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Logs de Erro</TabsTrigger>
          <TabsTrigger value="ai-usage">Uso de IA</TabsTrigger>
+          <TabsTrigger value="funnel">Análise de Funil</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

@@ .. @@
        <TabsContent value="ai-usage">
          <AIUsageReports />
        </TabsContent>

+        <TabsContent value="funnel">
+          <FunnelAnalyticsPanel />
+        </TabsContent>
+
        <TabsContent value="alerts">
          <AlertManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};