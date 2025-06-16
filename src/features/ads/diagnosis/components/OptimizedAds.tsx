import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OptimizedAdsProps {
  optimizedAds: string[];
}

const OptimizedAds = ({ optimizedAds }: OptimizedAdsProps) => {
  if (optimizedAds.length === 0) return null;

  return (
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
  );
};

export default OptimizedAds;