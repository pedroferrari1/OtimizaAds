import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdGenerator } from "../hooks/useAdGenerator";
import AdGenerationForm from "./components/AdGenerationForm";
import GeneratedAdsList from "./components/GeneratedAdsList";

const AdGenerator = () => {
  const { 
    productName, 
    setProductName,
    productDescription, 
    setProductDescription,
    targetAudience, 
    setTargetAudience,
    isGenerating,
    generatedAds,
    handleGenerate,
    copyToClipboard,
    copiedIndex
  } = useAdGenerator();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerador de Anúncios</h1>
        <p className="text-gray-600 mt-2">
          Preencha as informações do seu produto e gere múltiplas variações de anúncios otimizados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>
              Quanto mais detalhadas as informações, melhores serão os anúncios gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdGenerationForm 
              productName={productName}
              setProductName={setProductName}
              productDescription={productDescription}
              setProductDescription={setProductDescription}
              targetAudience={targetAudience}
              setTargetAudience={setTargetAudience}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anúncios Gerados</CardTitle>
            <CardDescription>
              {generatedAds.length > 0 ? 
                "Clique no ícone de copiar para usar o texto do anúncio" : 
                "Os anúncios aparecerão aqui após a geração"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratedAdsList
              generatedAds={generatedAds}
              copiedIndex={copiedIndex}
              onCopy={copyToClipboard}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdGenerator;