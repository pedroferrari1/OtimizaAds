import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, RefreshCw, Settings, CheckCircle, AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/features/auth";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import SubscriptionPlans from "@/components/subscription/SubscriptionPlans";
import SubscriptionDetails from "./components/SubscriptionDetails";
import SubscriptionHistory from "./components/SubscriptionHistory";
import PaymentMethodDisplay from "@/components/subscription/PaymentMethodDisplay";

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
  const [usageData, setUsageData] = useState<{
    generations: { current: number; limit: number };
    diagnostics: { current: number; limit: number };
  } | undefined>(undefined);

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
        variant: "default",
      });
    }
    
    if (canceled === 'true') {
      setShowCanceled(true);
      toast({
        title: "Checkout cancelado",
        description: "Você cancelou o processo de checkout.",
        variant: "secondary",
      });
    }
    
    // Clean up URL parameters
    if (success || canceled) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user, userSubscription]);

  const fetchUsageData = async () => {
    try {
      const [generationsUsage, diagnosticsUsage] = await Promise.all([
        checkFeatureUsage('generations'),
        checkFeatureUsage('diagnostics')
      ]);
      
      if (generationsUsage && diagnosticsUsage) {
        setUsageData({
          generations: {
            current: generationsUsage.current_usage,
            limit: generationsUsage.limit_value
          },
          diagnostics: {
            current: diagnosticsUsage.current_usage,
            limit: diagnosticsUsage.limit_value
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de uso:', error);
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
                <Button 
                  variant="outline" 
                  className="mt-4 bg-white hover:bg-white" 
                  onClick={() => setShowSuccess(false)}
                >
                  Fechar
                </Button>
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
                <Button 
                  variant="outline" 
                  className="mt-4 bg-white hover:bg-white" 
                  onClick={() => setShowCanceled(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {user && userSubscription ? (
        <div className="space-y-8">
          {/* Current Subscription Status */}
          <SubscriptionDetails
            userSubscription={userSubscription}
            onManage={manageSubscription}
            onRefresh={refreshSubscription}
            loading={loading}
            usageData={usageData}
          />

          {/* All Plans */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Todos os Planos Disponíveis
            </h2>
            <SubscriptionPlans />
          </div>
          
          {/* Payment Method */}
          {userSubscription && userSubscription.status === 'active' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PaymentMethodDisplay
                brand="visa" // Exemplo - idealmente viria do Stripe
                last4="4242" // Exemplo - idealmente viria do Stripe
                isActive={userSubscription.status === 'active'}
                onManage={manageSubscription}
              />
              
              <SubscriptionHistory />
            </div>
          )}
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

export default Subscription;