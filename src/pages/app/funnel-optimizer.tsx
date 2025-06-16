import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelOptimizerForm } from "@/components/funnel-optimizer/FunnelOptimizerForm";
import { FunnelAnalysisResults } from "@/components/funnel-optimizer/FunnelAnalysisResults";
import { useFunnelOptimizer } from "@/hooks/useFunnelOptimizer";

const FunnelOptimizer = () => {
  const {
    adText,
    setAdText,
    landingPageText,
    setLandingPageText,
    isAnalyzing,
    analysisResults,
    handleAnalyze,
    resetResults
  } = useFunnelOptimizer();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Laboratório de Otimização de Funil</h1>
        <p className="text-gray-600 mt-2">
          Analise a coerência entre seu anúncio e página de destino para maximizar conversões
        </p>
      </div>

      {!analysisResults ? (
        <FunnelOptimizerForm
          adText={adText}
          setAdText={setAdText}
          landingPageText={landingPageText}
          setLandingPageText={setLandingPageText}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
        />
      ) : (
        <FunnelAnalysisResults
          results={analysisResults}
          originalAd={adText}
          originalLandingPage={landingPageText}
          onReset={resetResults}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Por que a coerência de funil é importante?</CardTitle>
          <CardDescription>
            Entenda como a sincronia entre anúncio e página de destino afeta suas conversões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              A coerência entre o anúncio e a página de destino é um dos fatores mais importantes para o sucesso de uma campanha. Quando um usuário clica em um anúncio, ele cria uma expectativa sobre o que encontrará na página de destino.
            </p>
            <p className="text-sm text-gray-700">
              Se a página não entregar o que foi prometido no anúncio, ou se a mensagem não for consistente, o usuário provavelmente abandonará o site sem converter. Isso não apenas desperdiça seu investimento em publicidade, mas também prejudica sua qualidade de anúncio nas plataformas.
            </p>
            <p className="text-sm text-gray-700">
              Nossa ferramenta analisa a coerência entre seu anúncio e página de destino, identificando desalinhamentos e sugerindo melhorias para maximizar suas conversões.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunnelOptimizer;