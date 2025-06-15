import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, RefreshCw, Settings, CheckCircle, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";

const Subscription = () => {
  const { 
    userSubscription, 
    loading, 
    checkFeatureUsage, 
    manageSubscription,
    refreshSubscription 
  } = useSubscription();
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);

  useEffect(() => {
    refreshSubscription();
    
    // Check for success or canceled query parameters
    const searchParams = new URLSearchParams(location.search);
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      setShowSuccess(true);
      toast({
        title: "Assinatura realizada com sucesso!",
        description: "Sua assinatura foi processada e está ativa.",
      });
    }
    
    if (canceled === 'true') {
      setShowCanceled(true);
      toast({
        title: "Checkout cancelado",
        description: "Você cancelou o processo de checkout.",
        variant: "destructive",
      });
    }
    
    // Clean up URL parameters
    if (success || canceled) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location]);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-gray-600 mt-2">
          Gerencie sua assinatura e veja seu uso atual
        </p>
      </div>

      {showSuccess && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-800 text-lg">Assinatura realizada com sucesso!</h3>
                <p className="text-green-700 mt-1">
                  Sua assinatura foi processada e está ativa. Você já pode aproveitar todos os benefícios do seu plano.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCanceled && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-800 text-lg">Checkout cancelado</h3>
                <p className="text-yellow-700 mt-1">
                  Você cancelou o processo de checkout. Se precisar de ajuda ou tiver dúvidas, entre em contato com nosso suporte.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user && userSubscription ? (
        <div className="space-y-8">
          {/* Current Subscription Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Sua Assinatura
                    <Badge className={getStatusColor(userSubscription.status)}>
                      {getStatusText(userSubscription.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Gerencie sua assinatura e veja seu uso atual
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={refreshSubscription} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
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
                    }).format(userSubscription.plan.price_monthly / 100)}/mês
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

          {/* Usage Statistics */}
          <UsageCard />

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
  );
};

// Component for showing usage statistics
const UsageCard = () => {
  const { checkFeatureUsage } = useSubscription();
  const [generationsUsage, setGenerationsUsage] = useState<any>(null);
  const [diagnosticsUsage, setDiagnosticsUsage] = useState<any>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      const [gens, diags] = await Promise.all([
        checkFeatureUsage('generations'),
        checkFeatureUsage('diagnostics')
      ]);
      setGenerationsUsage(gens);
      setDiagnosticsUsage(diags);
    };

    fetchUsage();
  }, []);

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (current: number, limit: number) => {
    if (limit === -1) return "bg-green-500";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso do Plano</CardTitle>
        <CardDescription>
          Acompanhe seu uso mensal dos recursos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generationsUsage && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Gerações de Anúncios</span>
                <span className="text-sm text-gray-600">
                  {generationsUsage.current_usage} / {generationsUsage.limit_value === -1 ? '∞' : generationsUsage.limit_value}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(generationsUsage.current_usage, generationsUsage.limit_value)}
                className="h-2"
              />
            </div>
          )}
          
          {diagnosticsUsage && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Diagnósticos</span>
                <span className="text-sm text-gray-600">
                  {diagnosticsUsage.current_usage} / {diagnosticsUsage.limit_value === -1 ? '∞' : diagnosticsUsage.limit_value}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(diagnosticsUsage.current_usage, diagnosticsUsage.limit_value)}
                className="h-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Subscription;