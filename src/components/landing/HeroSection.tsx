
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Target, TrendingUp } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Anúncios <span className="text-blue-600">Inteligentes</span>
            <br />
            Resultados <span className="text-blue-600">Garantidos</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transforme suas ideias em anúncios de alta conversão com nossa IA. 
            Perfeito para empreendedores que querem resultados sem complicação.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/registro">
              <Button size="lg" className="px-8 py-3 text-lg">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500">
              ✅ Sem cartão de crédito • ✅ 5 anúncios gratuitos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-gray-700 font-medium">Gere em 30 segundos</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <span className="text-gray-700 font-medium">Alta conversão</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <span className="text-gray-700 font-medium">Otimização automática</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
