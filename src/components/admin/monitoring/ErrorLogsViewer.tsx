
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type ErrorLog = Tables<"error_logs">;

export const ErrorLogsViewer = () => {
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    error_type: "",
    endpoint: "",
    resolved: "",
    search: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch error logs
  const { data: errorLogs, isLoading, refetch } = useQuery({
    queryKey: ["error-logs", filters],
    queryFn: async (): Promise<ErrorLog[]> => {
      let query = supabase
        .from("error_logs")
        .select("*")
        .order("last_occurrence", { ascending: false });

      if (filters.error_type) {
        query = query.eq("error_type", filters.error_type);
      }
      if (filters.endpoint) {
        query = query.ilike("endpoint", `%${filters.endpoint}%`);
      }
      if (filters.resolved !== "") {
        query = query.eq("resolved", filters.resolved === "true");
      }
      if (filters.search) {
        query = query.ilike("error_message", `%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Mark error as resolved
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase
        .from("error_logs")
        .update({ resolved: true })
        .eq("id", errorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["error-logs"] });
      toast({
        title: "Sucesso",
        description: "Erro marcado como resolvido!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setIsDetailDialogOpen(true);
  };

  const handleResolveError = (errorId: string) => {
    resolveErrorMutation.mutate(errorId);
  };

  const exportErrorLogs = () => {
    if (!errorLogs) return;

    const csvContent = [
      ["Tipo", "Mensagem", "Endpoint", "Frequência", "Status", "Primeira Ocorrência", "Última Ocorrência"].join(","),
      ...errorLogs.map(error => [
        error.error_type,
        `"${error.error_message.replace(/"/g, '""')}"`,
        error.endpoint || "",
        error.frequency || 1,
        error.resolved ? "Resolvido" : "Ativo",
        error.first_occurrence,
        error.last_occurrence
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      error_type: "",
      endpoint: "",
      resolved: "",
      search: "",
    });
  };

  // Get unique error types for filter
  const errorTypes = [...new Set(errorLogs?.map(log => log.error_type) || [])];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visualizador de Logs de Erro</CardTitle>
          <CardDescription>
            Monitore e gerencie erros da aplicação com filtros avançados
          </CardDescription>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por mensagem de erro..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <Select value={filters.error_type} onValueChange={(value) => setFilters({ ...filters, error_type: value })}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo de erro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {errorTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Endpoint..."
              className="w-[150px]"
              value={filters.endpoint}
              onChange={(e) => setFilters({ ...filters, endpoint: e.target.value })}
            />
            
            <Select value={filters.resolved} onValueChange={(value) => setFilters({ ...filters, resolved: value })}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="false">Ativos</SelectItem>
                <SelectItem value="true">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" onClick={exportErrorLogs}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando logs de erro...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Ocorrência</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs?.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell>
                      <Badge variant="outline">{error.error_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {error.error_message}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {error.endpoint || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{error.frequency || 1}</Badge>
                    </TableCell>
                    <TableCell>
                      {error.resolved ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolvido
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(error.last_occurrence), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(error)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!error.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveError(error.id)}
                            disabled={resolveErrorMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Erro</DialogTitle>
            <DialogDescription>
              Informações completas sobre o erro selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo do Erro</label>
                  <p className="text-sm text-gray-600">{selectedError.error_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Endpoint</label>
                  <p className="text-sm text-gray-600">{selectedError.endpoint || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Frequência</label>
                  <p className="text-sm text-gray-600">{selectedError.frequency || 1} ocorrências</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-gray-600">
                    {selectedError.resolved ? "Resolvido" : "Ativo"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Primeira Ocorrência</label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedError.first_occurrence), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Última Ocorrência</label>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedError.last_occurrence), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Mensagem do Erro</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded mt-1">
                  {selectedError.error_message}
                </p>
              </div>
              
              {selectedError.stack_trace && (
                <div>
                  <label className="text-sm font-medium">Stack Trace</label>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded mt-1 overflow-auto max-h-60">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                {!selectedError.resolved && (
                  <Button 
                    onClick={() => handleResolveError(selectedError.id)}
                    disabled={resolveErrorMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Resolvido
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
