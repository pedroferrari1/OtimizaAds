import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, ArrowUpDown, Eye, CreditCard, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserSubscriptionWithProfile } from "@/types/subscription";

interface SubscribersListProps {
  subscriptions: UserSubscriptionWithProfile[];
  loading: boolean;
  onRefresh: () => void;
}

const SubscribersList = ({ subscriptions, loading, onRefresh }: SubscribersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscriptionWithProfile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Obter lista única de planos para o filtro
  const uniquePlans = [...new Set(subscriptions.map(sub => sub.plan?.name))].filter(Boolean);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchTerm === '' || 
      sub.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.plan?.name === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Ordenar assinaturas
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'name_asc':
        return (a.profile?.full_name || a.profile?.email || '').localeCompare(b.profile?.full_name || b.profile?.email || '');
      case 'name_desc':
        return (b.profile?.full_name || b.profile?.email || '').localeCompare(a.profile?.full_name || a.profile?.email || '');
      case 'plan_asc':
        return (a.plan?.name || '').localeCompare(b.plan?.name || '');
      case 'plan_desc':
        return (b.plan?.name || '').localeCompare(a.plan?.name || '');
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'cancelled': return 'bg-yellow-600';
      case 'past_due': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'cancelled': return 'Cancelado';
      case 'past_due': return 'Em Atraso';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleViewDetails = (subscription: UserSubscriptionWithProfile) => {
    setSelectedSubscription(subscription);
    setIsDetailsOpen(true);
  };

  const handleManageSubscription = (subscription: UserSubscriptionWithProfile) => {
    setSelectedSubscription(subscription);
    setIsManageOpen(true);
  };

  const handleChangePlan = async (newPlanId: string) => {
    if (!selectedSubscription) return;
    
    try {
      setIsProcessing(true);
      
      // Simular mudança de plano
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar assinatura no banco de dados
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          plan_id: newPlanId,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);
      
      if (error) throw error;
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'subscription_plan_changed',
        target_user_id: selectedSubscription.user_id,
        details: { 
          old_plan_id: selectedSubscription.plan_id,
          new_plan_id: newPlanId,
          subscription_id: selectedSubscription.id
        }
      });
      
      toast({
        title: "Plano alterado",
        description: "O plano da assinatura foi alterado com sucesso.",
      });
      
      setIsManageOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o plano da assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;
    
    try {
      setIsProcessing(true);
      
      // Simular cancelamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar assinatura no banco de dados
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);
      
      if (error) throw error;
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'subscription_cancelled',
        target_user_id: selectedSubscription.user_id,
        details: { 
          subscription_id: selectedSubscription.id,
          plan_id: selectedSubscription.plan_id
        }
      });
      
      toast({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
      
      setIsManageOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!selectedSubscription) return;
    
    try {
      setIsProcessing(true);
      
      // Simular reativação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar assinatura no banco de dados
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);
      
      if (error) throw error;
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'subscription_reactivated',
        target_user_id: selectedSubscription.user_id,
        details: { 
          subscription_id: selectedSubscription.id,
          plan_id: selectedSubscription.plan_id
        }
      });
      
      toast({
        title: "Assinatura reativada",
        description: "A assinatura foi reativada com sucesso.",
      });
      
      setIsManageOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reativar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a lista de assinantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por email, nome ou plano..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="past_due">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                {uniquePlans.map(plan => (
                  <SelectItem key={plan} value={plan as string}>{plan}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Data (mais recente)</SelectItem>
                <SelectItem value="date_asc">Data (mais antiga)</SelectItem>
                <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
                <SelectItem value="plan_asc">Plano (A-Z)</SelectItem>
                <SelectItem value="plan_desc">Plano (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPlanFilter('all');
              setSortBy('date_desc');
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinantes</CardTitle>
          <CardDescription>
            Total: {filteredSubscriptions.length} assinantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Próxima Cobrança</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sub.profile?.email || 'Email não disponível'}</p>
                      <p className="text-sm text-gray-600">
                        {sub.profile?.full_name || 'Nome não disponível'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.plan?.name}</Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency((sub.plan?.price_monthly || 0) / 100)}/mês
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sub.status)}>
                      {getStatusText(sub.status)}
                    </Badge>
                    {sub.cancel_at_period_end && (
                      <p className="text-xs text-yellow-600 font-medium mt-1">
                        Cancelamento agendado
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(sub.created_at)}
                  </TableCell>
                  <TableCell>
                    {sub.current_period_end ? formatDate(sub.current_period_end) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(sub)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageSubscription(sub)}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sortedSubscriptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma assinatura encontrada com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription>
              Informações completas sobre a assinatura
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Usuário</h3>
                  <p className="font-medium">{selectedSubscription.profile?.email}</p>
                  <p className="text-sm">{selectedSubscription.profile?.full_name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedSubscription.status)}>
                      {getStatusText(selectedSubscription.status)}
                    </Badge>
                    {selectedSubscription.cancel_at_period_end && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        Cancelamento agendado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Plano</h3>
                  <p className="font-medium">{selectedSubscription.plan?.name}</p>
                  <p className="text-sm">{formatCurrency((selectedSubscription.plan?.price_monthly || 0) / 100)}/mês</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">ID da Assinatura</h3>
                  <p className="text-sm font-mono">{selectedSubscription.id}</p>
                  {selectedSubscription.stripe_subscription_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stripe: {selectedSubscription.stripe_subscription_id}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data de Início</h3>
                  <p>{formatDate(selectedSubscription.created_at)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Próxima Cobrança</h3>
                  <p>{selectedSubscription.current_period_end ? formatDate(selectedSubscription.current_period_end) : 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Recursos Incluídos</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedSubscription.plan?.features && Object.entries(selectedSubscription.plan.features)
                    .filter(([_, value]) => value === true || (typeof value === 'number' && value > 0) || value === -1 || value === 'all')
                    .map(([key, value]) => {
                      const label = key
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());
                      
                      let displayValue = '';
                      if (typeof value === 'number') {
                        displayValue = value === -1 ? 'Ilimitado' : value.toString();
                      } else if (typeof value === 'string') {
                        displayValue = value;
                      }
                      
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            {label} {displayValue ? `(${displayValue})` : ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setIsDetailsOpen(false);
              handleManageSubscription(selectedSubscription!);
            }}>
              Gerenciar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Assinatura</DialogTitle>
            <DialogDescription>
              Altere o plano ou status da assinatura
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedSubscription.profile?.email}</p>
                    <p className="text-sm text-gray-600">
                      {selectedSubscription.plan?.name} - {formatCurrency((selectedSubscription.plan?.price_monthly || 0) / 100)}/mês
                    </p>
                  </div>
                  <Badge className={getStatusColor(selectedSubscription.status)}>
                    {getStatusText(selectedSubscription.status)}
                  </Badge>
                </div>
              </div>
              
              <Tabs defaultValue="change_plan">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="change_plan">Alterar Plano</TabsTrigger>
                  <TabsTrigger value="cancel">Cancelar</TabsTrigger>
                  <TabsTrigger value="reactivate" disabled={selectedSubscription.status !== 'cancelled'}>
                    Reativar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="change_plan" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="new_plan">Novo Plano</Label>
                    <Select onValueChange={(value) => handleChangePlan(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptions
                          .map(s => s.plan)
                          .filter((plan, index, self) => 
                            plan && self.findIndex(p => p?.id === plan.id) === index && plan.is_active
                          )
                          .map(plan => plan && (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - {formatCurrency(plan.price_monthly / 100)}/mês
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-2">
                      A mudança de plano será aplicada imediatamente.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Alterar o plano de um assinante pode afetar sua cobrança e acesso a recursos.
                        Certifique-se de que o cliente foi informado sobre esta mudança.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="cancel" className="space-y-4 mt-4">
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Atenção: Você está prestes a cancelar esta assinatura</p>
                        <p className="text-sm text-red-700 mt-1">
                          O assinante perderá acesso aos recursos premium ao final do período atual.
                          Esta ação pode ser revertida antes do término do período.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Confirmar Cancelamento'
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="reactivate" className="space-y-4 mt-4">
                  <div className="bg-green-50 p-4 rounded-md border border-green-200">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Reativar assinatura cancelada</p>
                        <p className="text-sm text-green-700 mt-1">
                          A assinatura será reativada e o cliente voltará a ter acesso aos recursos premium.
                          Uma nova cobrança será gerada de acordo com o ciclo de faturamento.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="default" 
                      onClick={handleReactivateSubscription}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Reativar Assinatura'
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente Check para ícones de verificação
const Check = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default SubscribersList;