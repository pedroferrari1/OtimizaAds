
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AIUsageReports = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios de Uso de IA</CardTitle>
        <CardDescription>
          Métricas de uso dos modelos de IA, tokens e custos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Relatórios de IA em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
};
