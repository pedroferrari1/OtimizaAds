import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";

interface SubscriptionEvent {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

const SubscriptionHistory = () => {
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSubscriptionHistory();
    }
  }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps
  // A função fetchSubscriptionHistory é definida no componente e não muda entre renderizações

  const fetchSubscriptionHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('target_user_id', user?.id)
        .like('action', 'stripe_%')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventLabel = (action: string) => {
    switch (action) {
      case 'stripe_subscription_created':
        return 'Assinatura criada';
      case 'stripe_subscription_updated':
        return 'Assinatura atualizada';
      case 'stripe_subscription_canceled':
        return 'Assinatura cancelada';
      case 'stripe_payment_succeeded':
        return 'Pagamento realizado';
      case 'stripe_payment_failed':
        return 'Falha no pagamento';
      default:
        return action.replace('stripe_', '').replace(/_/g, ' ');
    }
  };

  const getEventBadge = (action: string) => {
    switch (action) {
      case 'stripe_subscription_created':
        return <Badge className="bg-green-600">Criação</Badge>;
      case 'stripe_subscription_updated':
        return <Badge className="bg-blue-600">Atualização</Badge>;
      case 'stripe_subscription_canceled':
        return <Badge className="bg-yellow-600">Cancelamento</Badge>;
      case 'stripe_payment_succeeded':
        return <Badge className="bg-green-600">Pagamento</Badge>;
      case 'stripe_payment_failed':
        return <Badge className="bg-red-600">Falha</Badge>;
      default:
        return <Badge variant="outline">{action.split('_')[1]}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Assinatura</CardTitle>
          <CardDescription>Carregando histórico...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Assinatura</CardTitle>
        <CardDescription>
          Últimas atividades relacionadas à sua assinatura
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-sm">
                    {formatDate(event.created_at)}
                  </TableCell>
                  <TableCell>
                    {getEventBadge(event.action)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {getEventLabel(event.action)}
                    {event.details?.subscription_id && (
                      <span className="text-xs text-gray-500 block mt-1">
                        ID: {event.details.subscription_id.substring(0, 10)}...
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-gray-500">
            Nenhum evento de assinatura encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionHistory;