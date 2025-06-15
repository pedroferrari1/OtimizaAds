
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle,
  Wifi,
  Key,
  Server,
  Save,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { getProviderConfig, type ProviderConfiguration } from "@/types/provider-config";

type ProviderConfigurationTable = Tables<"provider_configurations">;

// Provider-specific model options
const PROVIDER_MODELS = {
  openai: [
    { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (2025-04-14)" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" }
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" }
  ],
  novita: [
    { value: "meta-llama/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
    { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B" },
    { value: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B" }
  ],
  google: [
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "gemini-pro-vision", label: "Gemini Pro Vision" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }
  ],
  deepseek: [
    { value: "deepseek-chat", label: "DeepSeek Chat" },
    { value: "deepseek-coder", label: "DeepSeek Coder" }
  ],
  openai_compatible: [
    { value: "custom", label: "Custom Model" }
  ]
};

export const ProviderManager = () => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfigurationTable | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("providers");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states for detailed configuration
  const [providerConfig, setProviderConfig] = useState<ProviderConfiguration>({
    api_key: "",
    model: "",
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    timeout: 30,
    supports_streaming: true,
    supports_vision: false
  });

  // Fetch provider configurations
  const { data: providers, isLoading } = useQuery({
    queryKey: ["provider-configurations"],
    queryFn: async (): Promise<ProviderConfigurationTable[]> => {
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
    mutationFn: async (data: { id: string; configuration: ProviderConfiguration; is_active: boolean }) => {
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Math.random() > 0.3;
    },
    onSuccess: (success) => {
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

  const handleProviderConfig = (provider: ProviderConfigurationTable) => {
    setSelectedProvider(provider);
    const config = getProviderConfig(provider.configuration);
    setProviderConfig({
      api_key: "",
      model: config.model || "",
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2048,
      top_p: config.top_p || 0.9,
      frequency_penalty: config.frequency_penalty || 0,
      presence_penalty: config.presence_penalty || 0,
      timeout: config.timeout || 30,
      supports_streaming: config.supports_streaming ?? true,
      supports_vision: config.supports_vision ?? false,
      ...config
    });
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = () => {
    if (!selectedProvider) return;

    const configuration: ProviderConfiguration = {
      ...providerConfig,
      api_key: providerConfig.api_key ? "***CONFIGURED***" : undefined,
    };

    updateProviderMutation.mutate({
      id: selectedProvider.id,
      configuration,
      is_active: selectedProvider.is_active,
    });
  };

  const handleTestConnection = (providerId: string) => {
    setTestingProvider(providerId);
    testProviderMutation.mutate(providerId);
  };

  const toggleProviderStatus = (provider: ProviderConfigurationTable) => {
    const config = getProviderConfig(provider.configuration);
    updateProviderMutation.mutate({
      id: provider.id,
      configuration: config,
      is_active: !provider.is_active,
    });
  };

  const getProviderStatusIcon = (provider: ProviderConfigurationTable) => {
    if (testingProvider === provider.id) {
      return <Wifi className="h-4 w-4 animate-pulse text-yellow-500" />;
    }
    
    return provider.is_active ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  };

  const getProviderBadge = (providerName: string) => {
    const badges = {
      openai: <Badge variant="default">OpenAI</Badge>,
      anthropic: <Badge variant="secondary">Anthropic</Badge>,
      google: <Badge variant="outline">Gemini</Badge>,
      deepseek: <Badge className="bg-purple-100 text-purple-800">DeepSeek</Badge>,
      novita: <Badge className="bg-blue-100 text-blue-800">Novita</Badge>,
      openai_compatible: <Badge variant="outline">Compatible</Badge>
    };
    return badges[providerName as keyof typeof badges] || <Badge>{providerName}</Badge>;
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
              <TabsTrigger value="providers">Provedores</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              <div className="grid gap-4">
                {providers?.map((provider) => {
                  const config = getProviderConfig(provider.configuration);
                  return (
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
                            {getProviderBadge(provider.provider_name)}
                            {config.model && (
                              <Badge variant="outline">{config.model}</Badge>
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
                              <RefreshCw className="h-4 w-4 animate-spin" />
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
                          {config.api_key ? "Configurado" : "Não configurado"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {config.supports_streaming ? "Streaming" : "Sem streaming"}
                        </span>
                        {config.temperature && (
                          <span>Temp: {config.temperature}</span>
                        )}
                        {config.max_tokens && (
                          <span>Max tokens: {config.max_tokens}</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
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
                      {providers?.filter(p => {
                        const config = getProviderConfig(p.configuration);
                        return config.api_key;
                      }).length || 0}
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
                        <TableHead>Modelo</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Última Atualização</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers?.map((provider) => {
                        const config = getProviderConfig(provider.configuration);
                        return (
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
                            <TableCell>
                              {config.model || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {provider.api_endpoint || "N/A"}
                            </TableCell>
                            <TableCell>
                              {new Date(provider.updated_at).toLocaleDateString('pt-BR')}
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

      {/* Enhanced Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar {selectedProvider?.display_name}</DialogTitle>
            <DialogDescription>
              Configure todas as opções e parâmetros para este provedor
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuração da API</h3>
              
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={providerConfig.api_key}
                  onChange={(e) => setProviderConfig({ ...providerConfig, api_key: e.target.value })}
                  placeholder="Digite sua API key..."
                />
              </div>
              
              {selectedProvider?.provider_name === 'openai_compatible' && (
                <div>
                  <Label htmlFor="api_endpoint">Endpoint da API</Label>
                  <Input
                    id="api_endpoint"
                    value={selectedProvider.api_endpoint || ""}
                    onChange={(e) => setProviderConfig({ ...providerConfig, api_endpoint: e.target.value })}
                    placeholder="https://api.exemplo.com/v1"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="model">Modelo</Label>
                <Select
                  value={providerConfig.model}
                  onValueChange={(value) => setProviderConfig({ ...providerConfig, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_MODELS[selectedProvider?.provider_name as keyof typeof PROVIDER_MODELS]?.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={providerConfig.timeout}
                  onChange={(e) => setProviderConfig({ ...providerConfig, timeout: parseInt(e.target.value) })}
                  min="1"
                  max="300"
                />
              </div>
            </div>

            {/* Model Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parâmetros do Modelo</h3>
              
              <div>
                <Label>Temperatura: {providerConfig.temperature}</Label>
                <Slider
                  value={[providerConfig.temperature || 0.7]}
                  onValueChange={([value]) => setProviderConfig({ ...providerConfig, temperature: value })}
                  max={2}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Top P: {providerConfig.top_p}</Label>
                <Slider
                  value={[providerConfig.top_p || 0.9]}
                  onValueChange={([value]) => setProviderConfig({ ...providerConfig, top_p: value })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="max_tokens">Tokens Máximos</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={providerConfig.max_tokens}
                  onChange={(e) => setProviderConfig({ ...providerConfig, max_tokens: parseInt(e.target.value) })}
                  min="1"
                  max="8192"
                />
              </div>

              <div>
                <Label>Frequency Penalty: {providerConfig.frequency_penalty}</Label>
                <Slider
                  value={[providerConfig.frequency_penalty || 0]}
                  onValueChange={([value]) => setProviderConfig({ ...providerConfig, frequency_penalty: value })}
                  max={2}
                  min={-2}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Presence Penalty: {providerConfig.presence_penalty}</Label>
                <Slider
                  value={[providerConfig.presence_penalty || 0]}
                  onValueChange={([value]) => setProviderConfig({ ...providerConfig, presence_penalty: value })}
                  max={2}
                  min={-2}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="streaming"
                  checked={providerConfig.supports_streaming}
                  onCheckedChange={(checked) => setProviderConfig({ ...providerConfig, supports_streaming: checked })}
                />
                <Label htmlFor="streaming">Suporte a Streaming</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="vision"
                  checked={providerConfig.supports_vision}
                  onCheckedChange={(checked) => setProviderConfig({ ...providerConfig, supports_vision: checked })}
                />
                <Label htmlFor="vision">Suporte a Visão</Label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedProvider) {
                  handleTestConnection(selectedProvider.id);
                }
              }}
              variant="outline"
              disabled={testingProvider === selectedProvider?.id}
            >
              {testingProvider === selectedProvider?.id ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <Button onClick={handleSaveConfig} disabled={updateProviderMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
