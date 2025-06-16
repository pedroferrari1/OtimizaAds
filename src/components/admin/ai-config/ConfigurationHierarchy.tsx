
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Eye, Edit } from "lucide-react";
import { ConfigurationForm } from "./ConfigurationForm";

interface AIConfiguration {
  id: string;
  config_level: string;
  level_identifier: string | null;
  model_id: string | null;
  system_prompt: string | null;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at: string;
  ai_models?: {
    model_name: string;
    provider: string;
  };
}

export const ConfigurationHierarchy = () => {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const { toast } = useToast();

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_configurations')
        .select(`
          *,
          ai_models (
            model_name,
            provider
          )
        `)
        .order('config_level', { ascending: true });

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de IA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  // A função fetchConfigurations é definida no componente e não muda entre renderizações

  const handleEdit = (config: AIConfiguration) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setShowForm(true);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'global':
        return 'bg-blue-100 text-blue-800';
      case 'plan':
        return 'bg-green-100 text-green-800';
      case 'service':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'global':
        return 'Global';
      case 'plan':
        return 'Plano';
      case 'service':
        return 'Serviço';
      default:
        return level;
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
          <h2 className="text-2xl font-bold">Hierarquia de Configurações</h2>
          <p className="text-gray-600">
            Gerencie configurações de IA em múltiplos níveis: Global → Plano → Serviço
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Explicação da Hierarquia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como Funciona a Hierarquia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800">Global</Badge>
              <span>Configuração padrão para toda a aplicação</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">Plano</Badge>
              <span>Sobrepõe a configuração global para usuários de um plano específico</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-purple-100 text-purple-800">Serviço</Badge>
              <span>Sobrepõe as demais para uma funcionalidade específica</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <div className="space-y-4">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getLevelBadgeColor(config.config_level)}>
                      {getLevelName(config.config_level)}
                    </Badge>
                    {config.level_identifier && (
                      <Badge variant="outline">{config.level_identifier}</Badge>
                    )}
                    {!config.is_active && (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">
                    {config.config_level === 'global' ? 'Configuração Global' :
                     config.config_level === 'plan' ? `Plano: ${config.level_identifier}` :
                     `Serviço: ${config.level_identifier}`}
                  </CardTitle>
                  <CardDescription>
                    Modelo: {config.ai_models?.model_name || 'Não definido'} ({config.ai_models?.provider})
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(config)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Temperatura:</span>
                  <div>{config.temperature}</div>
                </div>
                <div>
                  <span className="font-medium">Max Tokens:</span>
                  <div>{config.max_tokens}</div>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <div>{config.is_active ? 'Ativo' : 'Inativo'}</div>
                </div>
                <div>
                  <span className="font-medium">Criado em:</span>
                  <div>{new Date(config.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
              {config.system_prompt && (
                <div className="mt-4">
                  <span className="font-medium text-sm">Prompt do Sistema:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                    {config.system_prompt.length > 200 
                      ? `${config.system_prompt.substring(0, 200)}...` 
                      : config.system_prompt}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Formulário */}
      {showForm && (
        <ConfigurationForm
          configuration={editingConfig}
          onClose={() => {
            setShowForm(false);
            setEditingConfig(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingConfig(null);
            fetchConfigurations();
          }}
        />
      )}
    </div>
  );
};
