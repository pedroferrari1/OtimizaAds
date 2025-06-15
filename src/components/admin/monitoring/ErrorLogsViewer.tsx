
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ErrorLogsViewer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Erro</CardTitle>
        <CardDescription>
          Visualização e análise de logs de erro da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Funcionalidade de logs de erro em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
};
