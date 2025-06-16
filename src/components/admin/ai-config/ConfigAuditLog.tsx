import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Search, Filter, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Json } from "@/integrations/supabase/types";

// Define type for audit log with admin profile
type AuditLogWithProfile = {
  id: string;
  action: string;
  admin_user_id: string | null;
  change_reason: string | null;
  config_id: string | null;
  new_values: Json;
  old_values: Json;
  timestamp: string;
  ai_configurations?: {
    config_level: string;
    level_identifier: string;
  } | null;
  admin_profile?: {
    full_name: string | null;
    email: string;
  } | null;
};

export const ConfigAuditLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogWithProfile | null>(null);

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ["ai-config-history", searchTerm, actionFilter],
    queryFn: async (): Promise<AuditLogWithProfile[]> => {
      let query = supabase
        .from("ai_config_history")
        .select(`
          *,
          ai_configurations (
            config_level,
            level_identifier
          )
        `)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Buscar dados dos usuários separadamente
      const logsWithUserData = await Promise.all((data || []).map(async (log) => {
        if (log.admin_user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", log.admin_user_id)
            .single();
          
          return {
            ...log,
            admin_profile: profile
          };
        }
        return log;
      }));

      // Filter by search term if provided
      if (searchTerm) {
        const filtered = logsWithUserData.filter((log) =>
          log.change_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ai_configurations?.level_identifier?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filtered;
      }

      return logsWithUserData;
    },
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return <Badge variant="default">Criado</Badge>;
      case "updated":
        return <Badge variant="secondary">Atualizado</Badge>;
      case "deleted":
        return <Badge variant="destructive">Excluído</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getConfigLevelLabel = (level: string) => {
    switch (level) {
      case "global":
        return "Global";
      case "plan":
        return "Plano";
      case "service":
        return "Serviço";
      default:
        return level;
    }
  };

  const formatJsonDiff = (oldValues: Json | null, newValues: Json | null) => {
    if (!oldValues && !newValues) return null;

    return (
      <div className="space-y-4">
        {oldValues && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Valores Anteriores:</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          </div>
        )}
        {newValues && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Novos Valores:</h4>
            <pre className="bg-green-50 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Log de Auditoria</CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log de Auditoria</CardTitle>
        <CardDescription>
          Histórico de todas as alterações nas configurações de IA
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por motivo, ação ou identificador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="created">Criado</SelectItem>
              <SelectItem value="updated">Atualizado</SelectItem>
              <SelectItem value="deleted">Excluído</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()}>
            <Filter className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Identificador</TableHead>
              <TableHead>Administrador</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {formatTimestamp(log.timestamp)}
                </TableCell>
                <TableCell>
                  {getActionBadge(log.action)}
                </TableCell>
                <TableCell>
                  {log.ai_configurations?.config_level && (
                    <Badge variant="outline">
                      {getConfigLevelLabel(log.ai_configurations.config_level)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {log.ai_configurations?.level_identifier || "N/A"}
                </TableCell>
                <TableCell className="text-sm">
                  {log.admin_profile?.full_name || log.admin_profile?.email || "Sistema"}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {log.change_reason || "Sem motivo especificado"}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Alteração</DialogTitle>
                        <DialogDescription>
                          {getActionBadge(log.action)} em {formatTimestamp(log.timestamp)}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold">Administrador:</h4>
                              <p className="text-sm">{log.admin_profile?.full_name || log.admin_profile?.email || "Sistema"}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold">Configuração:</h4>
                              <p className="text-sm">
                                {log.ai_configurations?.config_level && 
                                  `${getConfigLevelLabel(log.ai_configurations.config_level)} - ${log.ai_configurations.level_identifier || "Global"}`
                                }
                              </p>
                            </div>
                          </div>
                          
                          {log.change_reason && (
                            <div>
                              <h4 className="font-semibold">Motivo da Alteração:</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded">{log.change_reason}</p>
                            </div>
                          )}
                          
                          {(log.old_values || log.new_values) && (
                            <div>
                              <h4 className="font-semibold mb-2">Alterações:</h4>
                              {formatJsonDiff(log.old_values, log.new_values)}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {auditLogs?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum registro de auditoria encontrado</p>
            {(searchTerm || actionFilter !== "all") && (
              <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
