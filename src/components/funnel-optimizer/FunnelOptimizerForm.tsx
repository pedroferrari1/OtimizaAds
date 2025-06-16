import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Lightbulb } from "lucide-react";

interface FunnelOptimizerFormProps {
  adText: string;
  setAdText: (text: string) => void;
  landingPageText: string;
  setLandingPageText: (text: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export const FunnelOptimizerForm = ({
  adText,
  setAdText,
  landingPageText,
  setLandingPageText,
  isAnalyzing,
  onAnalyze
}: FunnelOptimizerFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="ad" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ad">Texto do Anúncio</TabsTrigger>
          <TabsTrigger value="landing">Texto da Página de Destino</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ad" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Texto do Anúncio
              </CardTitle>
              <CardDescription>
                Cole o texto completo do seu anúncio (título, descrição e chamada para ação)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  value={adText}
                  onChange={(e) => setAdText(e.target.value)}
                  placeholder="Ex: 🔥 Curso de Marketing Digital com 50% OFF! Aprenda a criar campanhas que convertem e aumente suas vendas. Últimas vagas disponíveis, inscreva-se agora!"
                  className="min-h-[200px] resize-none"
                />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Caracteres: {adText.length}</span>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-500" />
                    Inclua título, descrição e CTA para uma análise completa
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => document.querySelector('[data-value="landing"]')?.click()}
              className="flex items-center gap-2"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="landing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Texto da Página de Destino
              </CardTitle>
              <CardDescription>
                Cole o texto principal da sua página de destino (headline, benefícios, descrição)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  value={landingPageText}
                  onChange={(e) => setLandingPageText(e.target.value)}
                  placeholder="Ex: Curso Completo de Marketing Digital | Transforme seu negócio com estratégias comprovadas. Nosso curso abrange Facebook Ads, Google Ads, SEO e muito mais. Garanta 50% de desconto na inscrição até o final da semana."
                  className="min-h-[300px] resize-none"
                />
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Caracteres: {landingPageText.length}</span>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-500" />
                    Inclua os elementos principais da sua página para melhor análise
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => document.querySelector('[data-value="ad"]')?.click()}
            >
              Voltar ao Anúncio
            </Button>
            
            <Button 
              type="submit" 
              disabled={isAnalyzing || !adText.trim() || !landingPageText.trim()}
            >
              {isAnalyzing ? "Analisando..." : "Analisar Coerência"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
};