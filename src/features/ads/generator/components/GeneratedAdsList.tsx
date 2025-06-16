import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";

interface GeneratedAdsListProps {
  generatedAds: string[];
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
}

const GeneratedAdsList = ({ generatedAds, copiedIndex, onCopy }: GeneratedAdsListProps) => {
  return (
    <>
      {generatedAds.length > 0 ? (
        <div className="space-y-4">
          {generatedAds.map((ad, index) => (
            <div key={index} className="relative p-4 border rounded-lg bg-gray-50">
              <p className="text-sm text-gray-800 pr-8">{ad}</p>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => onCopy(ad, index)}
              >
                {copiedIndex === index ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-gray-500">
          Preencha o formulário e clique em "Gerar Anúncios" para ver os resultados
        </div>
      )}
    </>
  );
};

export default GeneratedAdsList;