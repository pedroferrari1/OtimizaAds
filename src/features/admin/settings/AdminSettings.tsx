import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Save, RefreshCw, Shield, Database, Mail } from "lucide-react";
import { useEffect } from "react";

const AdminSettings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    site_name: "OtimizaAds",
    default_language: "pt-BR",
    theme: "light",
    contact_email: "contato@otimizaads.com.br"
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    password_min_length: 8,
    password_require_special: true,
    password_require_number: true,
    password_require_uppercase: true,
    max_login_attempts: 5,
    session_timeout_minutes: 60
  });
  
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    email_from: "no-reply@otimizaads.com.br",
    email_signature: "Equipe OtimizaAds"
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['general_settings', 'security_settings', 'email_settings']);
      
      if (error) throw error;
      
      if (data) {
        data.forEach(item => {
          if (item.key === 'general_settings') {
            setGeneralSettings(prev => ({ ...prev, ...item.value }));
          } else if (item.key === 'security_settings') {
            setSecuritySettings(prev => ({ ...prev, ...item.value }));
          } else if (item.key === 'email_settings') {
            setEmailSettings(prev => ({ ...prev, ...item.value }));
          }
        });
      }
      
      toast({
        title: "Configurações carregadas",
        description: "As configurações do sistema foram carregadas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as configurações do sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const updates = [
        {
          key: 'general_settings',
          value: generalSettings,
          description: 'Configurações gerais do sistema'
        },
        {
          key: 'security_settings',
          value: securitySettings,
          description: 'Configurações de segurança'
        },
        {
          key: 'email_settings',
          value: emailSettings,
          description: 'Configurações de email'
        }
      ];
      
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
        action: 'settings_updated',
        details: { 
          updated_tabs: [activeTab],
          timestamp: new Date().toISOString()
        }
      });
      
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas com sucesso."
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações do sistema.",
        variant: "destructive"
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Plataforma</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações gerais da plataforma
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Altere as configurações básicas da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Nome do Site</Label>
                  <Input
                    id="site_name"
                    value={generalSettings.site_name}
                    onChange={(e) => setGeneralSettings({...generalSettings, site_name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de Contato</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={generalSettings.contact_email}
                    onChange={(e) => setGeneralSettings({...generalSettings, contact_email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_language">Idioma Padrão</Label>
                  <Select 
                    value={generalSettings.default_language} 
                    onValueChange={(value) => setGeneralSettings({...generalSettings, default_language: value})}
                  >
                    <SelectTrigger id="default_language">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">Inglês (Estados Unidos)</SelectItem>
                      <SelectItem value="es-ES">Espanhol (Espanha)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Select 
                    value={generalSettings.theme} 
                    onValueChange={(value) => setGeneralSettings({...generalSettings, theme: value})}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Selecione o tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configure as políticas de segurança da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Tamanho Mínimo de Senha</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="20"
                    value={securitySettings.password_min_length}
                    onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Tentativas Máximas de Login</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="1"
                    max="10"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, max_login_attempts: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Tempo de Sessão (minutos)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="15"
                    max="1440"
                    value={securitySettings.session_timeout_minutes}
                    onChange={(e) => setSecuritySettings({...securitySettings, session_timeout_minutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">Requisitos de Senha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="password_require_special"
                      checked={securitySettings.password_require_special}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, password_require_special: checked})}
                    />
                    <Label htmlFor="password_require_special">Exigir caracteres especiais</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="password_require_number"
                      checked={securitySettings.password_require_number}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, password_require_number: checked})}
                    />
                    <Label htmlFor="password_require_number">Exigir números</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="password_require_uppercase"
                      checked={securitySettings.password_require_uppercase}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, password_require_uppercase: checked})}
                    />
                    <Label htmlFor="password_require_uppercase">Exigir letras maiúsculas</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Configurações de Email
              </CardTitle>
              <CardDescription>
                Configure o serviço de envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Servidor SMTP</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp.example.com"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta SMTP</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    placeholder="587"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_port: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Usuário SMTP</Label>
                  <Input
                    id="smtp_user"
                    placeholder="user@example.com"
                    value={emailSettings.smtp_user}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_user: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Senha SMTP</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    placeholder="••••••••"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_from">Email de Origem</Label>
                  <Input
                    id="email_from"
                    placeholder="no-reply@otimizaads.com.br"
                    value={emailSettings.email_from}
                    onChange={(e) => setEmailSettings({...emailSettings, email_from: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email_signature">Assinatura de Email</Label>
                  <Input
                    id="email_signature"
                    placeholder="Equipe OtimizaAds"
                    value={emailSettings.email_signature}
                    onChange={(e) => setEmailSettings({...emailSettings, email_signature: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Teste de email",
                    description: "Funcionalidade de teste de email será implementada em breve.",
                  });
                }}>
                  Enviar Email de Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;