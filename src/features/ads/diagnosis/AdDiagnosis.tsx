import AdAnalyzer from "./components/AdAnalyzer";

const AdDiagnosis = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diagnóstico de Anúncios</h1>
        <p className="text-gray-600 mt-2">
          Cole o texto do seu anúncio atual e receba uma análise detalhada com sugestões de otimização
        </p>
      </div>

      <AdAnalyzer />
    </div>
  );
};

export default AdDiagnosis;