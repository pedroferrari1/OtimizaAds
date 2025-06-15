
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      description: "Perfeito para testar e começar",
      features: [
        "5 gerações de anúncios",
        "3 diagnósticos",
        "Modelos básicos",
        "Suporte por email"
      ],
      cta: "Começar Grátis",
      popular: false,
      ctaVariant: "outline" as const
    },
    {
      name: "Básico",
      price: "R$ 29",
      period: "/mês",
      description: "Ideal para pequenos negócios",
      features: [
        "50 gerações de anúncios",
        "25 diagnósticos",
        "Todos os modelos",
        "Otimização automática",
        "Análise básica de performance"
      ],
      cta: "Escolher Plano",
      popular: true,
      ctaVariant: "default" as const
    },
    {
      name: "Intermediário",
      price: "R$ 59",
      period: "/mês",
      description: "Para quem quer escalar",
      features: [
        "150 gerações de anúncios",
        "75 diagnósticos",
        "Análise de concorrentes",
        "Templates premium",
        "Relatórios detalhados",
        "Suporte prioritário"
      ],
      cta: "Escolher Plano",
      popular: false,
      ctaVariant: "default" as const
    },
    {
      name: "Premium",
      price: "R$ 99",
      period: "/mês",
      description: "Solução completa para agências",
      features: [
        "Gerações ilimitadas",
        "Diagnósticos ilimitados",
        "IA personalizada",
        "Múltiplas contas",
        "API access",
        "Suporte dedicado",
        "Treinamento personalizado"
      ],
      cta: "Escolher Plano",
      popular: false,
      ctaVariant: "default" as const
    }
  ];

  return (
    <section id="precos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Escolha o plano <span className="text-blue-600">ideal</span> para você
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comece gratuitamente e evolua conforme seu negócio cresce. Sem compromisso, cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Mais Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/registro" className="block">
                  <Button 
                    variant={plan.ctaVariant} 
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
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
    </section>
  );
};

export default PricingSection;
