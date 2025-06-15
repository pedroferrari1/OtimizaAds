import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DiagnosisReportProps {
  diagnosisReport: {
    clarityScore: number;
    hookAnalysis: string;
    ctaAnalysis: string;
    mentalTriggers: string[];
    suggestions: string[];
  } | null;
  isOptimizing: boolean;
  onOptimize: () => void;
}

const DiagnosisReportComponent = ({ diagnosisReport, isOptimizing, onOptimize }: DiagnosisReportProps) => {
  if (!diagnosisReport) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório de Diagnóstico</CardTitle>
        <CardDescription>
          Análise detalhada do seu anúncio com sugestões de melhoria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Clareza</h3>
          <p className="text-sm text-gray-500">
            Nota: {diagnosisReport.clarityScore}/10
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Análise do Gancho</h3>
          <p className="text-sm text-gray-800">{diagnosisReport.hookAnalysis}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Análise do CTA</h3>
          <p className="text-sm text-gray-800">{diagnosisReport.ctaAnalysis}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Gatilhos Mentais Identificados</h3>
          <ul className="list-disc list-inside text-sm text-gray-800">
            {diagnosisReport.mentalTriggers.map((trigger, index) => (
              <li key={index}>{trigger}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Sugestões de Melhoria</h3>
          <ul className="list-decimal list-inside text-sm text-gray-800">
            {diagnosisReport.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        <Button className="w-full" onClick={onOptimize} disabled={isOptimizing}>
          {isOptimizing ? "Otimizando anúncio..." : "Otimizar Anúncio"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DiagnosisReportComponent;
