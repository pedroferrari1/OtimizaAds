
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-white text-sm">4.9/5 - Mais de 1.000 usuários satisfeitos</span>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Pronto para <span className="text-yellow-400">revolucionar</span> seus anúncios?
        </h2>
        
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Junte-se a centenas de empreendedores que já estão vendendo mais com anúncios inteligentes. 
          Comece gratuitamente hoje mesmo!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/registro">
            <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
              Criar Minha Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-blue-100 text-sm">
            ✅ Sem compromisso • ✅ Cancele quando quiser • ✅ Suporte em português
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-500">
          <p className="text-blue-100 text-sm">
            "Aumentei minhas vendas em 60% no primeiro mês. O OtimizaAds é incrível!" 
            <br />
            <strong>- Maria Silva, Loja Online de Roupas</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
