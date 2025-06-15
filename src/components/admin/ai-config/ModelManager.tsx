
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ModelManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Modelos</CardTitle>
        <CardDescription>
          Adicionar, editar e configurar modelos de IA disponíveis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Gerenciador de modelos em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
};
