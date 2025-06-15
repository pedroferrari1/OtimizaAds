
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Plus, 
  Edit, 
  TestTube, 
  CheckCircle, 
  XCircle,
  Wifi,
  WifiOff,
  Key,
  Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ProviderConfiguration = Tables<"provider_configurations">;

export const ProviderManager = () => {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfiguration | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({
    api_key: "",
    api_endpoint: "",
    additional_config: "{}",
  });

  // Fetch provider configurations
  const { data: providers, isLoading } = useQuery({
    queryKey: ["provider-configurations"],
    queryFn: async (): Promise<ProviderConfiguration[]> => {
      const { data, error } = await supabase
        .from("provider_configurations")
        .select("*")
        .order("display_name");

      if (error) throw error;
      return data || [];
    },
  });

  // Update provider configuration
  const updateProviderMutation = useMutation({
    mutationFn: async (data: { id: string; configuration: any; is_active: boolean }) => {
      const { error } = await supabase
        .from("provider_configurations")
        .update({
          configuration: data.configuration,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-configurations"] });
      setIsConfigDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Configuração do provedor atualizada!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar configuração: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Test provider connection
  const testProviderMutation = useMutation({
    mutationFn: async (providerId: string) => {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random() > 0.3; // 70% success rate for simulation
    },
    onSuccess: (success, providerId) => {
      setTestingProvider(null);
      toast({
        title: success ? "Conexão Bem-sucedida" : "Falha na Conexão",
        description: success 
          ? "O provedor foi conectado com sucesso!" 
          : "Não foi possível conectar ao provedor. Verifique as configurações.",
        variant: success ? "default" : "destructive",
      });
    },
    onError: () => {
      setTestingProvider(null);
      toast({
        title: "Erro",
        description: "Erro ao testar conexão com o provedor.",
        variant: "destructive",
      });
    },
  });

  const handleProviderConfig = (provider: ProviderConfiguration) => {
    setSelectedProvider(provider);
    setFormData({
      api_key: "",
      api_endpoint: provider.api_endpoint || "",
      additional_config: JSON.stringify(provider.configuration, null, 2),
    });
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedProvider) return;

    try {
      const additionalConfig = JSON.parse(formData.additional_config);
      const configuration = {
        ...additionalConfig,
        api_key: formData.api_key ? "***CONFIGURED***" : undefined,
        api_endpoint: formData.api_endpoint,
      };

      updateProviderMutation.mutate({
        id: selectedProvider.id,
        configuration,
        is_active: selectedProvider.is_active,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Configuração JSON inválida",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = (providerId: string) => {
    setTestingProvider(providerId);
    testProviderMutation.mutate(providerId);
  };

  const toggleProviderStatus = (provider: ProviderConfiguration) => {
    updateProviderMutation.mutate({
      id: provider.id,
      configuration: provider.configuration,
      is_active: !provider.is_active,
    });
  };

  const getProviderStatusIcon = (provider: ProviderConfiguration) => {
    if (testingProvider === provider.id) {
      return <Wifi className="h-4 w-4 animate-pulse text-yellow-500" />;
    }
    
    return provider.is_active ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de Provedores</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de Provedores de IA</CardTitle>
          <CardDescription>
            Configure e gerencie provedores de IA: OpenAI, Anthropic, Gemini, DeepSeek e mais
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Provedores</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="grid gap-4">
                {providers?.map((provider) => (
                  <Card key={provider.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getProviderStatusIcon(provider)}
                        <div>
                          <h3 className="font-semibold">{provider.display_name}</h3>
                          <p className="text-sm text-gray-600">
                            {provider.api_endpoint || "Endpoint não configurado"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {provider.provider_name === 'openai' && (
                            <Badge variant="default">OpenAI</Badge>
                          )}
                          {provider.provider_name === 'anthropic' && (
                            <Badge variant="secondary">Anthropic</Badge>
                          )}
                          {provider.provider_name === 'google' && (
                            <Badge variant="outline">Gemini</Badge>
                          )}
                          {provider.provider_name === 'deepseek' && (
                            <Badge className="bg-purple-100 text-purple-800">DeepSeek</Badge>
                          )}
                          {provider.provider_name === 'novita' && (
                            <Badge className="bg-blue-100 text-blue-800">Novita</Badge>
                          )}
                          {provider.provider_name === 'openai_compatible' && (
                            <Badge variant="outline">Compatible</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={provider.is_active}
                          onCheckedChange={() => toggleProviderStatus(provider)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={testingProvider === provider.id || !provider.is_active}
                        >
                          {testingProvider === provider.id ? (
                            <Wifi className="h-4 w-4 animate-pulse" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProviderConfig(provider)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        {provider.configuration?.api_key ? "Configurado" : "Não configurado"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        {provider.configuration?.supports_streaming ? "Streaming" : "Sem streaming"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Provedores Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {providers?.filter(p => p.is_active).length || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Total de Provedores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {providers?.length || 0}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Configurados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {providers?.filter(p => p.configuration?.api_key).length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Status dos Provedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provedor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Última Atualização</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers?.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell className="font-medium">
                            {provider.display_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getProviderStatusIcon(provider)}
                              {provider.is_active ? "Ativo" : "Inativo"}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {provider.api_endpoint || "N/A"}
                          </TableCell>
                          <TableCell>
                            {new Date(provider.updated_at).toLocaleDateString('pt-BR')}
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

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar {selectedProvider?.display_name}</DialogTitle>
            <DialogDescription>
              Configure as credenciais e parâmetros para este provedor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Digite sua API key..."
              />
            </div>
            
            {selectedProvider?.provider_name === 'openai_compatible' && (
              <div>
                <Label htmlFor="api_endpoint">Endpoint da API</Label>
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  placeholder="https://api.exemplo.com/v1"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="additional_config">Configuração Adicional (JSON)</Label>
              <Textarea
                id="additional_config"
                value={formData.additional_config}
                onChange={(e) => setFormData({ ...formData, additional_config: e.target.value })}
                className="min-h-[150px] font-mono text-sm"
                placeholder='{"supports_vision": true, "max_tokens": 4096}'
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig} disabled={updateProviderMutation.isPending}>
                Salvar Configuração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
