
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Eye, EyeOff, Zap } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface NovitaConfig {
  endpoint: string;
  model: string;
  api_key: string;
  tokens_per_month: number;
  timeout: number;
}

interface AppSettings {
  free_plan_limit: {
    daily_ads: number;
    monthly_ads: number;
  };
  features: {
    ad_generator: boolean;
    ad_diagnosis: boolean;
  };
  api_limits: {
    novita_tokens_per_month: number;
  };
  novita_config: NovitaConfig;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    free_plan_limit: {
      daily_ads: 5,
      monthly_ads: 100,
    },
    features: {
      ad_generator: true,
      ad_diagnosis: true,
    },
    api_limits: {
      novita_tokens_per_month: 10000,
    },
    novita_config: {
      endpoint: "https://api.novita.ai/v3",
      model: "meta-llama/llama-3.1-8b-instruct",
      api_key: "",
      tokens_per_month: 10000,
      timeout: 30000,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const { toast } = useToast();

  const novitaModels = [
    "meta-llama/llama-3.1-8b-instruct",
    "meta-llama/llama-3.1-70b-instruct",
    "mistralai/mistral-7b-instruct",
    "anthropic/claude-3-haiku",
    "openai/gpt-3.5-turbo",
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['free_plan_limit', 'features', 'api_limits', 'novita_config']);

      if (error) {
        throw error;
      }

      if (data) {
        const settingsMap: any = {};
        data.forEach((item) => {
          settingsMap[item.key] = item.value;
        });

        setSettings({
          free_plan_limit: settingsMap.free_plan_limit || settings.free_plan_limit,
          features: settingsMap.features || settings.features,
          api_limits: settingsMap.api_limits || settings.api_limits,
          novita_config: settingsMap.novita_config || settings.novita_config,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testNovitaConnection = async () => {
    if (!settings.novita_config.api_key || !settings.novita_config.endpoint) {
      toast({
        title: "Configuração Incompleta",
        description: "Por favor, configure o endpoint e a chave da API antes de testar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(true);
      setConnectionStatus('unknown');

      // Simular teste de conexão (aqui você implementaria a chamada real)
      const response = await fetch(settings.novita_config.endpoint + '/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.novita_config.api_key}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(settings.novita_config.timeout),
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: "Conexão Bem-sucedida",
          description: "A API da Novita está respondendo corretamente.",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus('error');
      toast({
        title: "Falha na Conexão",
        description: "Não foi possível conectar com a API da Novita. Verifique as configurações.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Converter os objetos para o tipo Json antes de salvar
      const updates = [
        {
          key: 'free_plan_limit',
          value: settings.free_plan_limit as Json,
          description: 'Limites do plano gratuito',
        },
        {
          key: 'features',
          value: settings.features as Json,
          description: 'Features habilitadas globalmente',
        },
        {
          key: 'api_limits',
          value: settings.api_limits as Json,
          description: 'Limites de API externa',
        },
        {
          key: 'novita_config',
          value: settings.novita_config as Json,
          description: 'Configurações da integração com Novita AI',
        },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            key: update.key,
            value: update.value,
            description: update.description,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });

        if (error) {
          throw error;
        }
      }

      // Log da ação
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'settings_updated',
        details: { updated_settings: Object.keys(settings) } as Json
      });

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.slice(0, 4) + '•'.repeat(key.length - 8) + key.slice(-4);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações globais da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração da Novita AI */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Configuração da Novita AI
            </CardTitle>
            <CardDescription>
              Configure a integração com a API da Novita para geração de conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="novita-endpoint">Endpoint da API</Label>
                <Input
                  id="novita-endpoint"
                  value={settings.novita_config.endpoint}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      novita_config: {
                        ...settings.novita_config,
                        endpoint: e.target.value,
                      },
                    })
                  }
                  placeholder="https://api.novita.ai/v3"
                />
              </div>
              <div>
                <Label htmlFor="novita-model">Modelo</Label>
                <Select
                  value={settings.novita_config.model}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      novita_config: {
                        ...settings.novita_config,
                        model: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {novitaModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="novita-api-key">Chave da API</Label>
              <div className="flex gap-2">
                <Input
                  id="novita-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={showApiKey ? settings.novita_config.api_key : maskApiKey(settings.novita_config.api_key)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      novita_config: {
                        ...settings.novita_config,
                        api_key: e.target.value,
                      },
                    })
                  }
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="novita-tokens">Tokens por mês</Label>
                <Input
                  id="novita-tokens"
                  type="number"
                  value={settings.novita_config.tokens_per_month}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      novita_config: {
                        ...settings.novita_config,
                        tokens_per_month: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="novita-timeout">Timeout (ms)</Label>
                <Input
                  id="novita-timeout"
                  type="number"
                  value={settings.novita_config.timeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      novita_config: {
                        ...settings.novita_config,
                        timeout: parseInt(e.target.value) || 30000,
                      },
                    })
                  }
                  min="5000"
                  max="120000"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status da conexão:</span>
                {connectionStatus === 'success' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Conectado
                  </span>
                )}
                {connectionStatus === 'error' && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Erro de conexão
                  </span>
                )}
                {connectionStatus === 'unknown' && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    Não testado
                  </span>
                )}
              </div>
              <Button onClick={testNovitaConnection} disabled={testing} variant="outline">
                {testing ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Limites do Plano Gratuito */}
        <Card>
          <CardHeader>
            <CardTitle>Limites do Plano Gratuito</CardTitle>
            <CardDescription>
              Configure os limites de uso para usuários do plano gratuito
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="daily-ads">Anúncios por dia</Label>
              <Input
                id="daily-ads"
                type="number"
                value={settings.free_plan_limit.daily_ads}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    free_plan_limit: {
                      ...settings.free_plan_limit,
                      daily_ads: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="monthly-ads">Anúncios por mês</Label>
              <Input
                id="monthly-ads"
                type="number"
                value={settings.free_plan_limit.monthly_ads}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    free_plan_limit: {
                      ...settings.free_plan_limit,
                      monthly_ads: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Features da Aplicação */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades</CardTitle>
            <CardDescription>
              Ative ou desative funcionalidades globalmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ad-generator">Gerador de Anúncios</Label>
                <p className="text-sm text-gray-500">
                  Permite aos usuários gerar novos anúncios
                </p>
              </div>
              <Switch
                id="ad-generator"
                checked={settings.features.ad_generator}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: {
                      ...settings.features,
                      ad_generator: checked,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ad-diagnosis">Diagnóstico de Anúncios</Label>
                <p className="text-sm text-gray-500">
                  Permite aos usuários diagnosticar anúncios existentes
                </p>
              </div>
              <Switch
                id="ad-diagnosis"
                checked={settings.features.ad_diagnosis}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: {
                      ...settings.features,
                      ad_diagnosis: checked,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Status do Sistema */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações sobre o estado atual da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status da API:</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Operacional
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Última atualização:</span>
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Versão:</span>
                <span className="text-sm text-gray-600">1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
