import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SubscriptionPlan } from "@/types/subscription";

const PlanManager = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (planData: Partial<SubscriptionPlan>) => {
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            ...planData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast({
          title: "Plano atualizado",
          description: "Plano atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData as any);

        if (error) throw error;
        toast({
          title: "Plano criado",
          description: "Plano criado com sucesso.",
        });
      }

      fetchPlans();
      setIsDialogOpen(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano.",
        variant: "destructive",
      });
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;
      
      fetchPlans();
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: isActive ? 'plan_activated' : 'plan_deactivated',
        details: { 
          plan_id: planId,
          plan_name: plans.find(p => p.id === planId)?.name
        }
      });
      
      toast({
        title: "Status alterado",
        description: `Plano ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do plano.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
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
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h2>
          <p className="text-gray-600">Configure os planos de assinatura disponíveis</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
              </DialogTitle>
              <DialogDescription>
                Configure as informações e recursos do plano de assinatura.
              </DialogDescription>
            </DialogHeader>
            <PlanForm 
              plan={editingPlan} 
              onSave={savePlan}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingPlan(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`${!plan.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {formatPrice(plan.price_monthly)}/mês
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsDialogOpen(true);
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Recursos:</Label>
                  <div className="mt-2 space-y-1">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="text-sm text-gray-600">
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>: {
                          typeof value === 'boolean' ? (value ? 'Sim' : 'Não') :
                          typeof value === 'number' ? (value === -1 ? 'Ilimitado' : String(value)) :
                          String(value)
                        }
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor={`active-${plan.id}`} className="text-sm font-medium">
                    Plano Ativo
                  </Label>
                  <Switch
                    id={`active-${plan.id}`}
                    checked={plan.is_active}
                    onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                  />
                </div>

                {plan.stripe_price_id && (
                  <div>
                    <Label className="text-sm font-medium">Stripe Price ID:</Label>
                    <p className="text-xs text-gray-500 mt-1">{plan.stripe_price_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Form component for creating/editing plans
const PlanForm = ({ 
  plan, 
  onSave, 
  onCancel 
}: { 
  plan: SubscriptionPlan | null; 
  onSave: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price_monthly: plan?.price_monthly || 0,
    stripe_price_id: plan?.stripe_price_id || '',
    is_active: plan?.is_active ?? true,
    features: plan?.features || {
      generations: 0,
      diagnostics: 0,
      models: 'basic',
      support: 'email',
      optimization: false,
      performance_analysis: false,
      competitor_analysis: false,
      premium_templates: false,
      detailed_reports: false,
      priority_support: false,
      unlimited_generations: false,
      unlimited_diagnostics: false,
      custom_ai: false,
      multiple_accounts: false,
      api_access: false,
      dedicated_support: false,
      custom_training: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateFeature = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Plano</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Preço Mensal (centavos)</Label>
          <Input
            id="price"
            type="number"
            value={formData.price_monthly}
            onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="stripe_price_id">Stripe Price ID (opcional)</Label>
        <Input
          id="stripe_price_id"
          value={formData.stripe_price_id}
          onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id: e.target.value }))}
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Recursos do Plano</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="generations">Gerações (-1 para ilimitado)</Label>
            <Input
              id="generations"
              type="number"
              value={formData.features.generations}
              onChange={(e) => updateFeature('generations', parseInt(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="diagnostics">Diagnósticos (-1 para ilimitado)</Label>
            <Input
              id="diagnostics"
              type="number"
              value={formData.features.diagnostics}
              onChange={(e) => updateFeature('diagnostics', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Boolean features */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.features)
            .filter(([key, value]) => typeof value === 'boolean')
            .map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  id={key}
                  checked={value as boolean}
                  onCheckedChange={(checked) => updateFeature(key, checked)}
                />
                <Label htmlFor={key} className="capitalize">
                  {key.replace('_', ' ')}
                </Label>
              </div>
            ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label htmlFor="is_active">Plano Ativo</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {plan ? 'Atualizar' : 'Criar'} Plano
        </Button>
      </div>
    </form>
  );
};

export default PlanManager;