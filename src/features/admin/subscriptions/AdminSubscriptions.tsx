import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, Settings } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/features/auth";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSubscriptions = () => {
  const { 
    userSubscription, 
    loading, 
    checkFeatureUsage, 
    manageSubscription,
    refreshSubscription 
  } = useSubscription();
  const { user, isAdmin } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubscription();
      
      // Registrar atividade de administrador
      if (isAdmin) {
        await supabase.from('audit_logs').insert({
          admin_user_id: user?.id,
          action: 'subscription_data_refreshed',
          details: { timestamp: new Date().toISOString() }
        });
      }
      
      toast({
        title: "Dados atualizados",
        description: "As informações de assinatura foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as informações de assinatura.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefreshData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {user && userSubscription ? (
          <div className="space-y-8">
            {/* Current Subscription Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Assinaturas
                      <Badge className={getStatusColor(userSubscription.status)}>
                        {getStatusText(userSubscription.status)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Gerencie as assinaturas e veja o uso atual
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRefreshData} 
                      variant="outline" 
                      size="sm" 
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
                    </Button>
                    <Button onClick={manageSubscription} variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">Plano Atual</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {userSubscription.plan.name}
                    </p>
                    <p className="text-gray-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format((userSubscription.plan.price_monthly || 0) / 100)}/mês
                    </p>
                  </div>
                  
                  {userSubscription.current_period_end && (
                    <div>
                      <h3 className="font-semibold text-gray-900">Próxima Cobrança</h3>
                      <p className="text-lg flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(userSubscription.current_period_end)}
                      </p>
                      {userSubscription.cancel_at_period_end && (
                        <p className="text-sm text-yellow-600 font-medium">
                          Cancelamento agendado
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">Status</h3>
                    <Badge className={getStatusColor(userSubscription.status)}>
                      {getStatusText(userSubscription.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Plans */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Todos os Planos Disponíveis
              </h2>
              <SubscriptionPlans />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Escolha seu Plano de Assinatura
              </h1>
              <p className="text-xl text-gray-600">
                {user ? 
                  "Você ainda não tem uma assinatura ativa." :
                  "Faça login para gerenciar sua assinatura."
                }
              </p>
            </div>
            <SubscriptionPlans />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscriptions;