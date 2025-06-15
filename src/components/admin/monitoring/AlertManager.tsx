
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const AlertManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Alertas</CardTitle>
        <CardDescription>
          Configuração de alertas automáticos e notificações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Sistema de alertas em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
};
