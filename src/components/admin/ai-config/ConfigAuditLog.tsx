
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ConfigAuditLog = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Auditoria</CardTitle>
        <CardDescription>
          Histórico de todas as alterações nas configurações de IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Log de auditoria em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
};
