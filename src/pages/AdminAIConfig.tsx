
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelManager } from "@/components/admin/ai-config/ModelManager";
import { ConfigurationHierarchy } from "@/components/admin/ai-config/ConfigurationHierarchy";
import { PromptEditor } from "@/components/admin/ai-config/PromptEditor";
import { ConfigAuditLog } from "@/components/admin/ai-config/ConfigAuditLog";
import { ProviderManager } from "@/components/admin/ai-config/ProviderManager";
import { AIMonitoring } from "@/components/admin/ai-config/AIMonitoring";

const AdminAIConfig = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações de IA</h1>
        <p className="text-gray-600 mt-2">
          Gerenciamento completo de modelos, provedores, prompts e monitoramento de IA
        </p>
      </div>

      <Tabs defaultValue="hierarchy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="providers">Provedores</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="hierarchy">
          <ConfigurationHierarchy />
        </TabsContent>

        <TabsContent value="models">
          <ModelManager />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptEditor />
        </TabsContent>

        <TabsContent value="providers">
          <ProviderManager />
        </TabsContent>

        <TabsContent value="monitoring">
          <AIMonitoring />
        </TabsContent>

        <TabsContent value="audit">
          <ConfigAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAIConfig;
