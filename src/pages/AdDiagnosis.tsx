import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DiagnosisReport {
  clarityScore: number;
  hookAnalysis: string;
  ctaAnalysis: string;
  mentalTriggers: string[];
  suggestions: string[];
}

const AdDiagnosis = () => {
  const [adText, setAdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisReport, setDiagnosisReport] = useState<DiagnosisReport | null>(null);
  const [optimizedAds, setOptimizedAds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const saveToHistory = async (originalText: string, diagnosisReport: DiagnosisReport, optimizedAds: string[]) => {
    if (!user) return;

    try {
      const content = `TEXTO ORIGINAL:\n${originalText}\n\n---\n\nRELATÓRIO DE DIAGNÓSTICO:\n${JSON.stringify(diagnosisReport, null, 2)}\n\n---\n\nVERSÕES OTIMIZADAS:\n${optimizedAds.join('\n\n')}`;
      
      // Convert data to Json compatible format
      const inputData = JSON.parse(JSON.stringify({
        originalText,
        diagnosisReport,
        optimizedAds
      }));
      
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: user.id,
          type: 'diagnosis',
          title: `Diagnóstico: ${originalText.substring(0, 50)}...`,
          content: content,
          input_data: inputData
        });

      if (error) {
        console.error('Error saving to history:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar no histórico.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Salvo no histórico!",
          description: "O diagnóstico foi salvo no seu histórico.",
        });
      }
    } catch (error) {
      console.error('Error saving to history:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar no histórico.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adText.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Por favor, insira o texto do anúncio para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // TODO: Integrate with Novita.ai API via Supabase Edge Function
      console.log("Analyzing ad:", adText);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock diagnosis report
      const mockReport: DiagnosisReport = {
        clarityScore: 7.5,
        hookAnalysis: "O gancho inicial está adequado, mas poderia ser mais impactante. Considere usar uma pergunta provocativa ou uma estatística surpreendente.",
        ctaAnalysis: "A chamada para ação está presente, mas não transmite urgência. Adicione elementos de escassez ou tempo limitado.",
        mentalTriggers: ["Urgência", "Autoridade", "Prova Social"],
        suggestions: [
          "Adicione uma pergunta provocativa no início",
          "Inclua números ou estatísticas para credibilidade",
          "Reforce a chamada para ação com urgência",
          "Use mais gatilhos de prova social"
        ]
      };
      
      setDiagnosisReport(mockReport);
      toast({
        title: "Análise concluída!",
        description: "Seu anúncio foi analisado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!diagnosisReport) return;
    
    setIsOptimizing(true);

    try {
      // TODO: Integrate with Novita.ai API using diagnosis context
      console.log("Optimizing ad based on diagnosis:", diagnosisReport);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimized ads
      const mockOptimizedAds = [
        "🚨 Você sabia que 87% das pessoas falham no marketing digital? Descubra o método exato que transformou mais de 1.000 empreendedores em especialistas. ⏰ Últimas 24h com desconto! Clique agora! 👇",
        "❓ Por que seus concorrentes vendem mais que você? A resposta está no nosso curso comprovado por + de 500 alunos. 🔥 Apenas hoje: 50% OFF! Garantir minha vaga →",
        "✅ Método aprovado por 1.000+ empreendedores está com vagas limitadas! Transforme seu negócio em 30 dias ou seu dinheiro de volta. ⚡ Restam apenas 12 vagas! Quero me inscrever!"
      ];
      
      setOptimizedAds(mockOptimizedAds);
      
      // Save to history
      await saveToHistory(adText, diagnosisReport, mockOptimizedAds);
      
      toast({
        title: "Otimização concluída!",
        description: "3 versões otimizadas foram geradas.",
      });
    } catch (error) {
      toast({
        title: "Erro na otimização",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diagnóstico de Anúncios</h1>
        <p className="text-gray-600 mt-2">
          Cole o texto do seu anúncio atual e receba uma análise detalhada com sugestões de otimização
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Texto do Anúncio</CardTitle>
            <CardDescription>
              Cole aqui o texto completo do anúncio que você quer analisar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adText">Texto do Anúncio</Label>
                <Textarea
                  id="adText"
                  placeholder="Cole aqui o texto completo do seu anúncio..."
                  value={adText}
                  onChange={(e) => setAdText(e.target.value)}
                  rows={8}
                  className="min-h-[200px] resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isAnalyzing || !adText.trim()}>
                {isAnalyzing ? "Analisando anúncio..." : "Analisar Anúncio"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Diagnóstico</CardTitle>
            <CardDescription>
              {diagnosisReport ? 
                "Análise completa do seu anúncio com sugestões de melhoria" : 
                "O relatório aparecerá aqui após a análise"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnosisReport ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Pontuação de Clareza</span>
                    <span className={`text-2xl font-bold ${getScoreColor(diagnosisReport.clarityScore)}`}>
                      {diagnosisReport.clarityScore}/10
                    </span>
                  </div>
                  <Badge variant={diagnosisReport.clarityScore >= 8 ? "default" : diagnosisReport.clarityScore >= 6 ? "secondary" : "destructive"}>
                    {getScoreLabel(diagnosisReport.clarityScore)}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Análise do Gancho (Hook)</h4>
                  <p className="text-sm text-gray-600">{diagnosisReport.hookAnalysis}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Análise da Chamada para Ação</h4>
                  <p className="text-sm text-gray-600">{diagnosisReport.ctaAnalysis}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Gatilhos Mentais Sugeridos</h4>
                  <div className="flex flex-wrap gap-2">
                    {diagnosisReport.mentalTriggers.map((trigger, index) => (
                      <Badge key={index} variant="outline">{trigger}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Sugestões de Melhoria</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {diagnosisReport.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={handleOptimize} className="w-full" disabled={isOptimizing}>
                  {isOptimizing ? "Gerando versões otimizadas..." : "Gerar Versões Otimizadas"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                Cole seu anúncio e clique em "Analisar" para ver o diagnóstico
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {optimizedAds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Versões Otimizadas</CardTitle>
            <CardDescription>
              Anúncios gerados com base nas sugestões do diagnóstico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizedAds.map((ad, index) => (
                <div key={index} className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="default" className="bg-green-600">Versão {index + 1}</Badge>
                  </div>
                  <p className="text-sm text-gray-800">{ad}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdDiagnosis;
