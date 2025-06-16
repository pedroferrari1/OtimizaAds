import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";

interface AIUsageMetric {
  id: string;
  model_name: string;
  service_type: string;
  tokens_input: number | null;
  tokens_output: number | null;
  estimated_cost: number | null;
  response_time_ms: number | null;
  success: boolean | null;
  timestamp: string;
}

interface RecentActivityTableProps {
  usageMetrics: AIUsageMetric[];
}

const RecentActivityTable = ({ usageMetrics }: RecentActivityTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Modelo</TableHead>
          <TableHead>Serviço</TableHead>
          <TableHead>Tokens</TableHead>
          <TableHead>Custo</TableHead>
          <TableHead>Tempo</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usageMetrics?.slice(0, 10).map((metric) => (
          <TableRow key={metric.id}>
            <TableCell>
              {format(new Date(metric.timestamp), "dd/MM HH:mm", { locale: ptBR })}
            </TableCell>
            <TableCell className="font-medium">{metric.model_name}</TableCell>
            <TableCell>{metric.service_type}</TableCell>
            <TableCell>
              {((metric.tokens_input || 0) + (metric.tokens_output || 0)).toLocaleString()}
            </TableCell>
            <TableCell>${(metric.estimated_cost || 0).toFixed(4)}</TableCell>
            <TableCell>{metric.response_time_ms || 0}ms</TableCell>
            <TableCell>
              {metric.success ? (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sucesso
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RecentActivityTable;