
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, TrendingUp, Calendar, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PlanManager from "@/components/admin/subscription/PlanManager";

interface UserSubscription {
  id: string;
  user_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  plan: {
    name: string;
    price_monthly: number;
  };
  profile: {
    email: string;
    full_name: string | null;
  };
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [metrics, setMetrics] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    churnRate: 0
  });
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(name, price_monthly),
          profile:profiles(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as assinaturas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (subs: UserSubscription[]) => {
    const totalSubscriptions = subs.length;
    const activeSubscriptions = subs.filter(s => s.status === 'active').length;
    const monthlyRevenue = subs
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0) / 100;

    // Simple churn rate calculation (cancelled vs total)
    const cancelledSubs = subs.filter(s => s.status === 'cancelled').length;
    const churnRate = totalSubscriptions > 0 ? (cancelledSubs / totalSubscriptions) * 100 : 0;

    setMetrics({
      totalSubscriptions,
      activeSubscriptions,
      monthlyRevenue,
      churnRate
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = searchTerm === '' || 
      sub.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'cancelled': return 'bg-yellow-600';
      case 'past_due': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'cancelled': return 'Cancelado';
      case 'past_due': return 'Em Atraso';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Assinaturas</h1>
          <p className="text-gray-600 mt-2">
            Administre planos, assinaturas e métricas de receita
          </p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline">
          Atualizar Dados
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Assinaturas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSubscriptions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.activeSubscriptions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Recentes</CardTitle>
              <CardDescription>Últimas assinaturas criadas ou modificadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{sub.profile?.email || 'Email não disponível'}</p>
                      <p className="text-sm text-gray-600">
                        {sub.plan?.name} - {formatCurrency((sub.plan?.price_monthly || 0) / 100)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(sub.status)}>
                        {getStatusText(sub.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(sub.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por email, nome ou plano..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="past_due">Em Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Assinaturas</CardTitle>
              <CardDescription>
                Total: {filteredSubscriptions.length} assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSubscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{sub.profile?.email || 'Email não disponível'}</p>
                          <p className="text-sm text-gray-600">
                            {sub.profile?.full_name || 'Nome não disponível'}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">{sub.plan?.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency((sub.plan?.price_monthly || 0) / 100)}/mês
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={getStatusColor(sub.status)}>
                          {getStatusText(sub.status)}
                        </Badge>
                        {sub.current_period_end && (
                          <p className="text-xs text-gray-500 mt-1">
                            Até {formatDate(sub.current_period_end)}
                          </p>
                        )}
                        {sub.cancel_at_period_end && (
                          <p className="text-xs text-yellow-600 font-medium">
                            Cancelamento agendado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma assinatura encontrada com os filtros aplicados.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <PlanManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSubscriptions;
