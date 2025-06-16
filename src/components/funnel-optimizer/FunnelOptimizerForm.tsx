import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Lightbulb, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FunnelOptimizerFormProps {
  adText: string;
  setAdText: (text: string) => void;
  landingPageText: string;
  setLandingPageText: (text: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  canUseFeature?: boolean;
  usageData?: {current: number, limit: number} | null;
}

export const FunnelOptimizerForm = ({
  adText,
  setAdText,
  landingPageText,
  setLandingPageText,
  isAnalyzing,
  onAnalyze,
  canUseFeature = true,
  usageData
}: FunnelOptimizerFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {usageData && usageData.limit > 0 && (
        <Alert variant={usageData.current >= usageData.limit * 0.8 ? "warning" : "default"}>
          <AlertTitle className="flex items-center gap-2">
            {usageData.current >= usageData.limit * 0.8 && (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            Uso do recurso
          </AlertTitle>
          <AlertDescription>
            Você utilizou {usageData.current} de {usageData.limit} análises disponíveis em seu plano atual.
          </AlertDescription>
        </Alert>
      )}

      {!canUseFeature && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limite atingido</AlertTitle>
          <AlertDescription>
            Você atingiu o limite de análises do seu plano. Faça upgrade para continuar utilizando este recurso.
          </AlertDescription>
        </Alert>
      )}

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
                  disabled={!canUseFeature}
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
              disabled={!canUseFeature}
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
                  disabled={!canUseFeature}
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
              disabled={!canUseFeature}
            >
              Voltar ao Anúncio
            </Button>
            
            <Button 
              type="submit" 
              disabled={isAnalyzing || !adText.trim() || !landingPageText.trim() || !canUseFeature}
            >
              {isAnalyzing ? "Analisando..." : "Analisar Coerência"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
};