
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriptionPlan } from "@/types/subscription";

const SubscriptionPlans = () => {
  const { plans, userSubscription, createCheckoutSession, manageSubscription } = useSubscription();
  const { user } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const getFeatureList = (features: Record<string, any>) => {
    const featureMap: Record<string, (val: any) => string | null> = {
      generations: (val: number) => val === -1 ? 'Gerações ilimitadas' : `${val} gerações de anúncios`,
      diagnostics: (val: number) => val === -1 ? 'Diagnósticos ilimitados' : `${val} diagnósticos`,
      models: (val: string) => val === 'all' ? 'Todos os modelos' : 'Modelos básicos',
      optimization: (val: boolean) => val ? 'Otimização automática' : null,
      performance_analysis: (val: boolean) => val ? 'Análise básica de performance' : null,
      competitor_analysis: (val: boolean) => val ? 'Análise de concorrentes' : null,
      premium_templates: (val: boolean) => val ? 'Templates premium' : null,
      detailed_reports: (val: boolean) => val ? 'Relatórios detalhados' : null,
      priority_support: (val: boolean) => val ? 'Suporte prioritário' : null,
      custom_ai: (val: boolean) => val ? 'IA personalizada' : null,
      multiple_accounts: (val: boolean) => val ? 'Múltiplas contas' : null,
      api_access: (val: boolean) => val ? 'API access' : null,
      dedicated_support: (val: boolean) => val ? 'Suporte dedicado' : null,
      custom_training: (val: boolean) => val ? 'Treinamento personalizado' : null,
      support: (val: string) => {
        const supportMap: Record<string, string> = {
          email: 'Suporte por email',
          priority: 'Suporte prioritário',
          dedicated: 'Suporte dedicado'
        };
        return supportMap[val] || `Suporte ${val}`;
      }
    };

    return Object.entries(features)
      .map(([key, value]) => {
        const formatter = featureMap[key];
        if (formatter && value) {
          return formatter(value);
        }
        return null;
      })
      .filter(Boolean) as string[];
  };

  const isCurrentPlan = (planId: string) => {
    return userSubscription?.plan_id === planId;
  };

  const getButtonText = (plan: SubscriptionPlan) => {
    if (!user) return "Faça Login";
    if (isCurrentPlan(plan.id)) return "Plano Atual";
    if (plan.name === "Gratuito") return "Começar Grátis";
    return "Escolher Plano";
  };

  const handlePlanAction = (plan: SubscriptionPlan) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (isCurrentPlan(plan.id)) {
      manageSubscription();
    } else if (plan.name === "Gratuito") {
      // Handle free plan logic if needed
    } else {
      createCheckoutSession(plan.id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Escolha o plano <span className="text-blue-600">ideal</span> para você
        </h2>
        <p className="text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
          Comece gratuitamente e evolua conforme seu negócio cresce.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const features = getFeatureList(plan.features);
          const isPopular = plan.name === "Básico";
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                isPopular ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'
              } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Mais Popular
                </Badge>
              )}
              
              {isCurrent && (
                <Badge className="absolute -top-3 right-4 bg-green-600">
                  Seu Plano
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(plan.price_monthly)}
                  </span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <CardDescription className="mt-2">
                  {plan.name === "Gratuito" && "Perfeito para testar e começar"}
                  {plan.name === "Básico" && "Ideal para pequenos negócios"}
                  {plan.name === "Intermediário" && "Para quem quer escalar"}
                  {plan.name === "Premium" && "Solução completa para agências"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanAction(plan)}
                  variant={isCurrent ? "secondary" : isPopular ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                  disabled={isCurrent && plan.name !== "Gratuito"}
                >
                  {isCurrent && <Users className="h-4 w-4 mr-2" />}
                  {getButtonText(plan)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-600 mb-4">
          🔒 Todos os planos incluem segurança SSL e backup automático
        </p>
        <p className="text-sm text-gray-500">
          Precisa de algo personalizado? <a href="#" className="text-blue-600 hover:underline">Entre em contato</a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
