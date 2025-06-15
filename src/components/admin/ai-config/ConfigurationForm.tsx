
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIModel {
  id: string;
  model_name: string;
  provider: string;
}

interface ConfigurationFormProps {
  configuration?: any;
  onClose: () => void;
  onSave: () => void;
}

export const ConfigurationForm = ({ configuration, onClose, onSave }: ConfigurationFormProps) => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [formData, setFormData] = useState({
    config_level: 'global',
    level_identifier: '',
    model_id: '',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
    if (configuration) {
      setFormData({
        config_level: configuration.config_level,
        level_identifier: configuration.level_identifier || '',
        model_id: configuration.model_id || '',
        system_prompt: configuration.system_prompt || '',
        temperature: configuration.temperature,
        max_tokens: configuration.max_tokens,
        top_p: configuration.top_p,
        frequency_penalty: configuration.frequency_penalty,
        presence_penalty: configuration.presence_penalty,
        is_active: configuration.is_active,
      });
    }
  }, [configuration]);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('model_name');

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        level_identifier: formData.level_identifier || null,
      };

      if (configuration) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('ai_configurations')
          .update(data)
          .eq('id', configuration.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Configuração atualizada com sucesso.",
        });
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('ai_configurations')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Configuração criada com sucesso.",
        });
      }

      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {configuration ? 'Editar Configuração' : 'Nova Configuração'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="config_level">Nível de Configuração</Label>
              <Select 
                value={formData.config_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, config_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="plan">Plano</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.config_level !== 'global' && (
              <div>
                <Label htmlFor="level_identifier">
                  {formData.config_level === 'plan' ? 'Nome do Plano' : 'Nome do Serviço'}
                </Label>
                <Input
                  id="level_identifier"
                  value={formData.level_identifier}
                  onChange={(e) => setFormData(prev => ({ ...prev, level_identifier: e.target.value }))}
                  placeholder={formData.config_level === 'plan' ? 'ex: premium' : 'ex: generation'}
                  required={formData.config_level !== 'global'}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="model_id">Modelo de IA</Label>
            <Select 
              value={formData.model_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, model_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.model_name} ({model.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="system_prompt">Prompt do Sistema</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              placeholder="Digite o prompt do sistema..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperatura</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                min="1"
                max="8192"
                value={formData.max_tokens}
                onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="top_p">Top P</Label>
              <Input
                id="top_p"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={formData.top_p}
                onChange={(e) => setFormData(prev => ({ ...prev, top_p: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="frequency_penalty">Frequency Penalty</Label>
              <Input
                id="frequency_penalty"
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={formData.frequency_penalty}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency_penalty: parseFloat(e.target.value) }))}
              />
            </div>

            <div>
              <Label htmlFor="presence_penalty">Presence Penalty</Label>
              <Input
                id="presence_penalty"
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={formData.presence_penalty}
                onChange={(e) => setFormData(prev => ({ ...prev, presence_penalty: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Configuração Ativa</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
