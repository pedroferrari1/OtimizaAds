import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FunnelAnalysisResult } from "@/types/funnel-optimizer";
import { ArrowLeft, Copy, CheckCircle, ArrowUpDown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FunnelAnalysisResultsProps {
  results: FunnelAnalysisResult;
  originalAd: string;
  originalLandingPage: string;
  onReset: () => void;
}

export const FunnelAnalysisResults = ({
  results,
  originalAd,
  originalLandingPage,
  onReset
}: FunnelAnalysisResultsProps) => {
  const [copiedAd, setCopiedAd] = useState(false);
  const { toast } = useToast();

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Excelente";
    if (score >= 6) return "Bom";
    return "Precisa melhorar";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAd(true);
      setTimeout(() => setCopiedAd(false), 2000);
      toast({
        title: "Texto copiado!",
        description: "O anúncio otimizado foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">Pontuação de Coerência:</span>
            <span className={`text-2xl font-bold ${getScoreColor(results.funnelCoherenceScore)}`}>
              {results.funnelCoherenceScore}/10
            </span>
          </div>
          <Badge variant={
            results.funnelCoherenceScore >= 8 ? "default" : 
            results.funnelCoherenceScore >= 6 ? "secondary" : 
            "destructive"
          }>
            {getScoreLabel(results.funnelCoherenceScore)}
          </Badge>
        </div>
        
        <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Nova Análise
        </Button>
      </div>

      <Tabs defaultValue="diagnosis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
          <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          <TabsTrigger value="optimized">Anúncio Otimizado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="diagnosis" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Diagnóstico do Anúncio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{results.adDiagnosis}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Diagnóstico da Página de Destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{results.landingPageDiagnosis}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-blue-600" />
                Análise de Coerência
              </CardTitle>
              <CardDescription>
                Avaliação da sincronia entre seu anúncio e página de destino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Impacto na Conversão</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {results.funnelCoherenceScore >= 8 
                          ? "Sua coerência de funil está excelente! Isso deve resultar em altas taxas de conversão e menor custo por aquisição."
                          : results.funnelCoherenceScore >= 6
                          ? "Sua coerência de funil é boa, mas há espaço para melhorias. Implementar as sugestões pode aumentar suas conversões."
                          : "A baixa coerência entre seu anúncio e página de destino está provavelmente prejudicando suas conversões. Recomendamos implementar as sugestões urgentemente."}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Anúncio Original</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{originalAd}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Página de Destino</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{originalLandingPage}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suggestions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Sugestões de Melhoria
              </CardTitle>
              <CardDescription>
                Recomendações para aumentar a coerência e melhorar as conversões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {results.syncSuggestions.map((suggestion, index) => (
                  <li key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm text-gray-700">{suggestion}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Para maximizar suas conversões, recomendamos:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Implementar as sugestões de melhoria listadas acima</li>
                  <li>Utilizar o anúncio otimizado fornecido na próxima aba</li>
                  <li>Testar diferentes variações para identificar o que funciona melhor</li>
                  <li>Monitorar as métricas de desempenho após as alterações</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimized" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Anúncio Otimizado</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(results.optimizedAd)}
                  className="flex items-center gap-2"
                >
                  {copiedAd ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Versão reescrita do seu anúncio para maior coerência com a página de destino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{results.optimizedAd}</p>
              </div>
              
              <div className="mt-6 space-y-2">
                <h3 className="font-medium text-gray-900">Por que este anúncio funciona melhor?</h3>
                <p className="text-sm text-gray-700">
                  Este anúncio foi otimizado para criar uma experiência coerente com sua página de destino. 
                  Ele mantém as promessas alinhadas com o que o usuário encontrará na página, 
                  utiliza linguagem e tom similares, e enfatiza os mesmos benefícios e pontos-chave.
                </p>
                <p className="text-sm text-gray-700">
                  A coerência entre anúncio e página de destino não apenas melhora a experiência do usuário, 
                  mas também aumenta a qualidade do anúncio nas plataformas de publicidade, 
                  potencialmente reduzindo seu custo por clique e aumentando as conversões.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={onReset}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Nova Análise
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};