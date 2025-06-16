import { useState } from "react";
import AdTextForm from "@/components/diagnosis/AdTextForm";
import DiagnosisReportComponent from "@/components/diagnosis/DiagnosisReport";
import OptimizedAds from "@/components/diagnosis/OptimizedAds";
import { useDiagnosis } from "../../hooks/useDiagnosis";

const AdAnalyzer = () => {
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

      {optimizedAds.length > 0 && (
        <div className="lg:col-span-2">
          <OptimizedAds optimizedAds={optimizedAds} />
        </div>
      )}
    </div>
  );
};

export default AdAnalyzer;