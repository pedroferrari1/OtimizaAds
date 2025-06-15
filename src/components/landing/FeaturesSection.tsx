
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Search, Gauge, Users } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Wand2,
      title: "Gerador de Anúncios IA",
      description: "Crie anúncios profissionais em segundos. Nossa IA analisa seu produto e gera textos persuasivos que convertem.",
      example: "Ex: 'Produto: Tênis esportivo' → Anúncio completo com título, descrição e CTA otimizados"
    },
    {
      icon: Search,
      title: "Diagnóstico Inteligente",
      description: "Analise seus anúncios existentes e descubra por que não estão convertendo. Receba sugestões específicas.",
      example: "Ex: 'Seu título está muito genérico' + 3 sugestões de melhoria"
    },
    {
      icon: Gauge,
      title: "Otimização com 1 Clique",
      description: "Melhore automaticamente seus anúncios com base em dados de performance e tendências do mercado.",
      example: "Ex: Taxa de conversão aumentou 45% após otimização automática"
    },
    {
      icon: Users,
      title: "Análise de Concorrentes",
      description: "Veja o que seus concorrentes estão fazendo e receba insights para se destacar no mercado.",
      example: "Ex: 'Concorrente X usa este tipo de CTA' + sugestão diferenciada para você"
    }
  ];

  return (
    <section id="funcionalidades" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tudo que você precisa para <span className="text-blue-600">vender mais</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ferramentas poderosas e simples de usar, feitas especialmente para empreendedores como você.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-base text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 italic">
                    {feature.example}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
