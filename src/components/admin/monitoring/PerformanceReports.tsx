
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw } from "lucide-react";

interface PerformanceData {
  endpoint: string;
  method: string;
  avg_response_time: number;
  total_requests: number;
  error_count: number;
  error_rate: number;
}

export const PerformanceReports = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Por enquanto, vamos simular dados de performance
      // Em produção, isso viria de uma função que agrega os dados da tabela api_performance_logs
      const mockData: PerformanceData[] = [
        {
          endpoint: "/api/generate-ad",
          method: "POST",
          avg_response_time: 1250,
          total_requests: 324,
          error_count: 3,
          error_rate: 0.93
        },
        {
          endpoint: "/api/diagnose-ad",
          method: "POST",
          avg_response_time: 890,
          total_requests: 156,
          error_count: 1,
          error_rate: 0.64
        },
        {
          endpoint: "/api/auth/login",
          method: "POST",
          avg_response_time: 145,
          total_requests: 89,
          error_count: 0,
          error_rate: 0
        },
        {
          endpoint: "/api/user/profile",
          method: "GET",
          avg_response_time: 78,
          total_requests: 445,
          error_count: 2,
          error_rate: 0.45
        }
      ];

      setPerformanceData(mockData);
    } catch (error) {
      console.error('Erro ao buscar dados de performance:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de performance.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  // A função fetchPerformanceData é definida no componente e não muda entre renderizações

  const filteredData = performanceData.filter(item =>
    item.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLatencyColor = (latency: number) => {
    if (latency <= 200) return "text-green-600";
    if (latency <= 500) return "text-yellow-600";
    return "text-red-600";
  };

  const getErrorRateColor = (errorRate: number) => {
    if (errorRate <= 1) return "text-green-600";
    if (errorRate <= 3) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Performance</h2>
          <p className="text-gray-600">
            Performance detalhada de todos os endpoints da API
          </p>
        </div>
        <Button onClick={fetchPerformanceData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por endpoint ou método..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance por Endpoint</CardTitle>
          <CardDescription>
            Métricas detalhadas de latência e taxa de erro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Endpoint</th>
                  <th className="text-left py-2">Método</th>
                  <th className="text-right py-2">Latência Média</th>
                  <th className="text-right py-2">Total Requisições</th>
                  <th className="text-right py-2">Erros</th>
                  <th className="text-right py-2">Taxa de Erro</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-mono text-sm">{item.endpoint}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                        item.method === 'POST' ? 'bg-green-100 text-green-800' :
                        item.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.method}
                      </span>
                    </td>
                    <td className={`py-3 text-right font-semibold ${getLatencyColor(item.avg_response_time)}`}>
                      {item.avg_response_time}ms
                    </td>
                    <td className="py-3 text-right">{item.total_requests.toLocaleString()}</td>
                    <td className="py-3 text-right">{item.error_count}</td>
                    <td className={`py-3 text-right font-semibold ${getErrorRateColor(item.error_rate)}`}>
                      {item.error_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
