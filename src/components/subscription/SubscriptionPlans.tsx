import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/features/auth";
import { SubscriptionPlan } from "@/types/subscription";
import { STRIPE_PRODUCTS } from "@/stripe-config";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubscriptionPlans = () => {
  const { plans, userSubscription, createCheckoutSession, manageSubscription } = useSubscription();
  const { user } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

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
    if (loadingPlanId === plan.id) return "Processando...";
    if (isCurrentPlan(plan.id)) return "Plano Atual";
    if (plan.name === "Gratuito") return "Começar Grátis";
    return "Escolher Plano";
  };

  const handlePlanAction = async (plan: SubscriptionPlan) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (isCurrentPlan(plan.id)) {
      manageSubscription();
    } else if (plan.name === "Gratuito") {
      // Lógica para plano gratuito
      toast({
        title: "Plano Gratuito",
        description: "Você está utilizando o plano gratuito.",
      });
    } else {
      setLoadingPlanId(plan.id);
      try {
        await createCheckoutSession(plan.id);
        // O redirecionamento é feito dentro da função createCheckoutSession
      } finally {
        setLoadingPlanId(null);
      }
    }
  };

  // Add the Stripe product to the plans array if it's not already there
  const allPlans = [...plans];
  
  // Check if we already have the Plano Básico in our plans
  const basicPlanExists = allPlans.some(plan => 
    plan.name === "Plano Básico" || 
    plan.stripe_price_id === STRIPE_PRODUCTS.basicPlan.priceId
  );
  
  // If not, add it
  if (!basicPlanExists) {
    allPlans.push({
      id: "stripe-basic-plan",
      name: "Plano Básico",
      price_monthly: 2990, // R$29.90 in cents
      currency: "BRL",
      features: {
        generations: 100,
        diagnostics: 50,
        models: "basic",
        support: "email",
        optimization: true,
        performance_analysis: true,
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
      },
      is_active: true,
      stripe_price_id: STRIPE_PRODUCTS.basicPlan.priceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  // Check if we already have the Plano Intermediário in our plans
  const intermediatePlanExists = allPlans.some(plan => 
    plan.name === "Plano Intermediário" || 
    plan.stripe_price_id === STRIPE_PRODUCTS.intermediatePlan.priceId
  );
  
  // If not, add it
  if (!intermediatePlanExists) {
    allPlans.push({
      id: "stripe-intermediate-plan",
      name: "Plano Intermediário",
      price_monthly: 5990, // R$59.90 in cents
      currency: "BRL",
      features: {
        generations: 250,
        diagnostics: 100,
        models: "all",
        support: "priority",
        optimization: true,
        performance_analysis: true,
        competitor_analysis: true,
        premium_templates: true,
        detailed_reports: true,
        priority_support: true,
        unlimited_generations: false,
        unlimited_diagnostics: false,
        custom_ai: false,
        multiple_accounts: false,
        api_access: false,
        dedicated_support: false,
        custom_training: false
      },
      is_active: true,
      stripe_price_id: STRIPE_PRODUCTS.intermediatePlan.priceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  // Check if we already have the Plano Premium in our plans
  const premiumPlanExists = allPlans.some(plan => 
    plan.name === "Plano Premium" || 
    plan.stripe_price_id === STRIPE_PRODUCTS.premiumPlan.priceId
  );
  
  // If not, add it
  if (!premiumPlanExists) {
    allPlans.push({
      id: "stripe-premium-plan",
      name: "Plano Premium",
      price_monthly: 9990, // R$99.90 in cents
      currency: "BRL",
      features: {
        generations: -1,
        diagnostics: -1,
        models: "all",
        support: "dedicated",
        optimization: true,
        performance_analysis: true,
        competitor_analysis: true,
        premium_templates: true,
        detailed_reports: true,
        priority_support: true,
        unlimited_generations: true,
        unlimited_diagnostics: true,
        custom_ai: true,
        multiple_accounts: true,
        api_access: true,
        dedicated_support: true,
        custom_training: true
      },
      is_active: true,
      stripe_price_id: STRIPE_PRODUCTS.premiumPlan.priceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

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
        {allPlans.map((plan) => {
          const features = getFeatureList(plan.features);
          const isPopular = plan.name === "Plano Básico";
          const isCurrent = isCurrentPlan(plan.id);
          const isButtonLoading = loadingPlanId === plan.id;

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
                  {plan.name === "Plano Básico" && "Ideal para pequenos negócios"}
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
                  disabled={isButtonLoading || (isCurrent && plan.name !== "Gratuito")}
                >
                  {isButtonLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isCurrent && !isButtonLoading && <Users className="h-4 w-4 mr-2" />}
                  {getButtonText(plan)}
                </Button>
                {plan.name !== "Gratuito" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-center mt-2 text-gray-500 cursor-help flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" className="mr-1">
                            <path d="M9.17 7.209c0-.438.107-.765.322-.983.214-.218.536-.327.965-.327.43 0 .752.11.966.327.215.218.322.545.322.983 0 .437-.107.764-.322.982-.214.217-.536.326-.966.326-.429 0-.75-.109-.965-.326-.215-.218-.322-.545-.322-.982zm12.56-2.466H8.431v7.496h13.3V4.743z" fill="#32325D"/>
                            <path d="M8.431 12.239h13.3v-2.27l-13.3.001v2.269z" fill="#32325D"/>
                          </svg>
                          Pagamento seguro via Stripe
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Seus dados de pagamento são processados com segurança pelo Stripe, líder mundial em pagamentos online.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
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