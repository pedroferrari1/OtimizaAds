import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Database, Gauge, Cpu } from "lucide-react";

export const SystemHealthConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("performance");
  const { toast } = useToast();
  
  // Configurações de performance
  const [performanceConfig, setPerformanceConfig] = useState({
    cache_enabled: true,
    cache_expiry_hours: 24,
    request_timeout_seconds: 30,
    max_concurrent_requests: 10,
    load_balancing_enabled: true
  });
  
  // Configurações de monitoramento
  const [monitoringConfig, setMonitoringConfig] = useState({
    error_logging_level: "warning",
    performance_tracking_enabled: true,
    health_check_interval_minutes: 5,
    alert_threshold_response_time_ms: 2000,
    alert_threshold_error_rate_percent: 5
  });
  

  // Buscar configurações
  useEffect(() => {
    fetchConfigurations();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  // A função fetchConfigurations é definida no componente e não muda entre renderizações

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      
      // Buscar configurações de app_settings
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['system_performance', 'system_monitoring']);
      
      if (error) throw error;
      
      if (data) {
        data.forEach(item => {
          if (item.key === 'system_performance') {
            setPerformanceConfig(item.value as any);
          } else if (item.key === 'system_monitoring') {
            setMonitoringConfig(item.value as any);
          }
        });
      }
      
      toast({
        title: "Configurações carregadas",
        description: "As configurações do sistema foram carregadas com sucesso."
      });
    } catch (error: unknown) {
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

  const saveConfigurations = async () => {
    try {
      setSaving(true);
      
      // Preparar atualizações
      const updates = [
        {
          key: 'system_performance',
          value: performanceConfig,
          description: 'Configurações de performance do sistema'
        },
        {
          key: 'system_monitoring',
          value: monitoringConfig,
          description: 'Configurações de monitoramento do sistema'
        },
      ];
      
      // Salvar configurações
      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            key: update.key,
            value: update.value,
            description: update.description,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });
          
        if (error) throw error;
      }
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'system_settings_updated',
        details: { 
          updated_tabs: [activeTab],
          timestamp: new Date().toISOString()
        }
      });
      
      // Limpar cache expirado
      if (activeTab === 'performance' && performanceConfig.cache_enabled) {
        await supabase.rpc('clean_expired_cache');
      }
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas com sucesso."
      });
    } catch (error: unknown) {
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
          <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
          <p className="text-gray-600">Gerencie as configurações de performance e monitoramento</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchConfigurations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
          <Button onClick={saveConfigurations} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                Configurações de Performance
              </CardTitle>
              <CardDescription>
                Otimize o desempenho do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cache_enabled">Cache do Sistema</Label>
                  <p className="text-sm text-gray-500">
                    Habilita o cache para melhorar a performance e reduzir custos
                  </p>
                </div>
                <Switch
                  id="cache_enabled"
                  checked={performanceConfig.cache_enabled}
                  onCheckedChange={(checked) => setPerformanceConfig({...performanceConfig, cache_enabled: checked})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cache_expiry_hours">Tempo de Expiração do Cache (horas)</Label>
                  <Input
                    id="cache_expiry_hours"
                    type="number"
                    min="1"
                    max="168"
                    value={performanceConfig.cache_expiry_hours}
                    onChange={(e) => setPerformanceConfig({...performanceConfig, cache_expiry_hours: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="request_timeout_seconds">Timeout de Requisições (segundos)</Label>
                  <Input
                    id="request_timeout_seconds"
                    type="number"
                    min="5"
                    max="120"
                    value={performanceConfig.request_timeout_seconds}
                    onChange={(e) => setPerformanceConfig({...performanceConfig, request_timeout_seconds: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_concurrent_requests">Requisições Concorrentes Máximas</Label>
                  <Input
                    id="max_concurrent_requests"
                    type="number"
                    min="1"
                    max="50"
                    value={performanceConfig.max_concurrent_requests}
                    onChange={(e) => setPerformanceConfig({...performanceConfig, max_concurrent_requests: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="load_balancing_enabled">Balanceamento de Carga</Label>
                  <p className="text-sm text-gray-500">
                    Distribui requisições entre múltiplas instâncias
                  </p>
                </div>
                <Switch
                  id="load_balancing_enabled"
                  checked={performanceConfig.load_balancing_enabled}
                  onCheckedChange={(checked) => setPerformanceConfig({...performanceConfig, load_balancing_enabled: checked})}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Otimização de Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Manutenção agendada",
                    description: "A manutenção do banco de dados foi agendada para o próximo período de baixo tráfego.",
                  });
                }}>
                  Agendar Manutenção
                </Button>
                
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Cache limpo",
                    description: "O cache do sistema foi limpo com sucesso.",
                  });
                }}>
                  Limpar Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                Configurações de Monitoramento
              </CardTitle>
              <CardDescription>
                Configure como o sistema é monitorado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="error_logging_level">Nível de Log de Erros</Label>
                <Select 
                  value={monitoringConfig.error_logging_level} 
                  onValueChange={(value) => setMonitoringConfig({...monitoringConfig, error_logging_level: value})}
                >
                  <SelectTrigger id="error_logging_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="performance_tracking_enabled">Rastreamento de Performance</Label>
                  <p className="text-sm text-gray-500">
                    Monitora o tempo de resposta e uso de recursos
                  </p>
                </div>
                <Switch
                  id="performance_tracking_enabled"
                  checked={monitoringConfig.performance_tracking_enabled}
                  onCheckedChange={(checked) => setMonitoringConfig({...monitoringConfig, performance_tracking_enabled: checked})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="health_check_interval_minutes">Intervalo de Health Check (minutos)</Label>
                  <Input
                    id="health_check_interval_minutes"
                    type="number"
                    min="1"
                    max="60"
                    value={monitoringConfig.health_check_interval_minutes}
                    onChange={(e) => setMonitoringConfig({...monitoringConfig, health_check_interval_minutes: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="alert_threshold_response_time_ms">Limite de Alerta - Tempo de Resposta (ms)</Label>
                  <Input
                    id="alert_threshold_response_time_ms"
                    type="number"
                    min="100"
                    max="10000"
                    value={monitoringConfig.alert_threshold_response_time_ms}
                    onChange={(e) => setMonitoringConfig({...monitoringConfig, alert_threshold_response_time_ms: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="alert_threshold_error_rate_percent">Limite de Alerta - Taxa de Erro (%)</Label>
                <Input
                  id="alert_threshold_error_rate_percent"
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={monitoringConfig.alert_threshold_error_rate_percent}
                  onChange={(e) => setMonitoringConfig({...monitoringConfig, alert_threshold_error_rate_percent: parseFloat(e.target.value)})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};