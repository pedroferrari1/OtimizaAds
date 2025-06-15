import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Eye, EyeOff, Zap, Info } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface NovitaConfig {
  endpoint: string;
  model: string;
  api_key: string;
  tokens_per_month: number;
  timeout: number;
  name: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
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
    // Novita config deixado aqui apenas para manter compatibilidade do objeto, mas NÃO será mais exibido no painel!
    novita_config: {
      endpoint: "",
      model: "",
      api_key: "",
      tokens_per_month: 0,
      timeout: 0,
      name: "",
      temperature: 0,
      top_p: 0,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 0,
      stream: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus<'unknown' | 'success' | 'error'>('unknown');
  const { toast } = useToast();

  const novitaModels = [
    "meta-llama/llama-3.1-8b-instruct",
    "meta-llama/llama-3.1-70b-instruct",
    "meta-llama/llama-3.1-405b-instruct",
    "mistralai/mistral-7b-instruct-v0.3",
    "mistralai/mixtral-8x7b-instruct-v0.1",
    "mistralai/mixtral-8x22b-instruct-v0.1",
    "anthropic/claude-3-haiku-20240307",
    "anthropic/claude-3-sonnet-20240229",
    "anthropic/claude-3-opus-20240229",
    "qwen/qwen2.5-72b-instruct",
    "google/gemma-2-9b-it",
    "nvidia/llama-3.1-nemotron-70b-instruct",
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

      // Fazer teste real da API Novita usando o endpoint correto
      const response = await fetch(`${settings.novita_config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.novita_config.api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.novita_config.model,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente de teste.',
              name: settings.novita_config.name,
            },
            {
              role: 'user',
              content: 'Teste de conexão',
            }
          ],
          max_tokens: 10,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(settings.novita_config.timeout),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          setConnectionStatus('success');
          toast({
            title: "Conexão Bem-sucedida",
            description: "A API da Novita está respondendo corretamente.",
          });
        } else {
          throw new Error('Resposta inválida da API');
        }
      } else {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus('error');
      toast({
        title: "Falha na Conexão",
        description: `Não foi possível conectar com a API da Novita: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
          value: settings.novita_config as unknown as Json,
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
    <TooltipProvider>
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
    </TooltipProvider>
  );
};

export default AdminSettings;
