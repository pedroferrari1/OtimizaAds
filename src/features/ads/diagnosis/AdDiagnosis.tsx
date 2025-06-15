import { useDiagnosis } from "@/features/ads";
import AdTextForm from "@/features/ads/diagnosis/AdTextForm";
import DiagnosisReportComponent from "@/features/ads/diagnosis/DiagnosisReport";
import OptimizedAds from "@/features/ads/diagnosis/OptimizedAds";

const AdDiagnosis = () => {
  const {
    adText,
    setAdText,
    isAnalyzing,
    diagnosisReport,
    optimizedAds,
    isOptimizing,
    handleAnalyze,
    handleOptimize
  } = useDiagnosis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diagnóstico de Anúncios</h1>
        <p className="text-gray-600 mt-2">
          Cole o texto do seu anúncio atual e receba uma análise detalhada com sugestões de otimização
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdTextForm
          adText={adText}
          setAdText={setAdText}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
        />

        <DiagnosisReportComponent
          diagnosisReport={diagnosisReport}
          isOptimizing={isOptimizing}
          onOptimize={handleOptimize}
        />
      </div>

      <OptimizedAds optimizedAds={optimizedAds} />
    </div>
  );
};

export default AdDiagnosis;
