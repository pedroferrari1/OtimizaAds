import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { UserSubscriptionWithProfile } from "@/types/subscription";
import { useToast } from "@/hooks/use-toast";

interface ReportsAndMetricsProps {
  subscriptions: UserSubscriptionWithProfile[];
  loading: boolean;
}

const ReportsAndMetrics = ({ subscriptions, loading }: ReportsAndMetricsProps) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [reportType, setReportType] = useState("revenue");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Gerar dados simulados para os relatórios
  const reportData = useMemo(() => {
    // Dados de receita mensal recorrente (MRR)
    const mrrData = generateMRRData();
    
    // Dados de churn
    const churnData = generateChurnData();
    
    // Dados de LTV
    const ltvData = generateLTVData();
    
    // Dados de conversão
    const conversionData = generateConversionData();
    
    // Dados de distribuição de planos
    const planDistribution = generatePlanDistribution(subscriptions);
    
    // Métricas principais
    const metrics = calculateMetrics(subscriptions, mrrData);
    
    return {
      mrrData,
      churnData,
      ltvData,
      conversionData,
      planDistribution,
      metrics
    };
  }, [subscriptions]);  // eslint-disable-line react-hooks/exhaustive-deps
  // timeRange não é usado diretamente no cálculo, então pode ser removido das dependências

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Relatório exportado",
        description: "O relatório foi exportado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
          <h2 className="text-2xl font-bold text-gray-900">Relatórios e Métricas</h2>
          <p className="text-gray-600">Análise detalhada de desempenho e receita</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.metrics.mrr)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+{reportData.metrics.mrrGrowth}% vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.metrics.churnRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              <span>+0.5% vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.metrics.ltv)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+12% vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.metrics.conversionRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+0.8% vs. mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="churn">Churn</TabsTrigger>
          <TabsTrigger value="ltv">LTV</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal Recorrente (MRR)</CardTitle>
              <CardDescription>
                Evolução da receita mensal ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.mrrData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip formatter={(value) => [`R$${value}`, 'MRR']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="mrr" 
                      name="MRR" 
                      stroke="#3b82f6" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newMrr" 
                      name="Novos Clientes" 
                      stroke="#10b981" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="churnMrr" 
                      name="Churn" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Receita por Plano</CardTitle>
              <CardDescription>
                Contribuição de cada plano para a receita total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${formatCurrency(value)}`, 'Receita']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Receita</CardTitle>
              <CardDescription>
                Análise detalhada por plano e período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Assinantes</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>ARR</TableHead>
                    <TableHead>% da Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.planDistribution.map((plan) => (
                    <TableRow key={plan.name}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{plan.subscribers}</TableCell>
                      <TableCell>{formatCurrency(plan.value)}</TableCell>
                      <TableCell>{formatCurrency(plan.value * 12)}</TableCell>
                      <TableCell>{plan.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell>{reportData.planDistribution.reduce((sum, plan) => sum + plan.subscribers, 0)}</TableCell>
                    <TableCell>{formatCurrency(reportData.planDistribution.reduce((sum, plan) => sum + plan.value, 0))}</TableCell>
                    <TableCell>{formatCurrency(reportData.planDistribution.reduce((sum, plan) => sum + plan.value * 12, 0))}</TableCell>
                    <TableCell>100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="churn" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Cancelamento (Churn)</CardTitle>
              <CardDescription>
                Evolução da taxa de churn ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.churnData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Churn Rate']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="churnRate" 
                      name="Taxa de Churn" 
                      stroke="#ef4444" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="netChurn" 
                      name="Churn Líquido" 
                      stroke="#f97316" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Motivos de Cancelamento</CardTitle>
              <CardDescription>
                Principais razões para cancelamento de assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { reason: 'Preço alto', count: 35 },
                      { reason: 'Não usa o suficiente', count: 28 },
                      { reason: 'Recursos insuficientes', count: 18 },
                      { reason: 'Problemas técnicos', count: 12 },
                      { reason: 'Mudou para concorrente', count: 7 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="reason" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Quantidade" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Análise de Retenção</CardTitle>
              <CardDescription>
                Taxa de retenção de clientes por coorte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coorte</TableHead>
                    <TableHead>Mês 1</TableHead>
                    <TableHead>Mês 2</TableHead>
                    <TableHead>Mês 3</TableHead>
                    <TableHead>Mês 6</TableHead>
                    <TableHead>Mês 12</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Jan/2024</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>92%</TableCell>
                    <TableCell>88%</TableCell>
                    <TableCell>75%</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Fev/2024</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>94%</TableCell>
                    <TableCell>90%</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mar/2024</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>95%</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Abr/2024</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ltv" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Valor do Cliente ao Longo da Vida (LTV)</CardTitle>
              <CardDescription>
                Evolução do LTV médio por cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.ltvData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${value}`} />
                    <Tooltip formatter={(value) => [`R$${value}`, 'LTV']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ltv" 
                      name="LTV Médio" 
                      stroke="#3b82f6" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>LTV por Plano</CardTitle>
              <CardDescription>
                Comparação do LTV entre diferentes planos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { plan: 'Básico', ltv: 350 },
                      { plan: 'Intermediário', ltv: 720 },
                      { plan: 'Premium', ltv: 1250 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan" />
                    <YAxis tickFormatter={(value) => `R$${value}`} />
                    <Tooltip formatter={(value) => [`R$${value}`, 'LTV']} />
                    <Legend />
                    <Bar dataKey="ltv" name="LTV Médio" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Análise de LTV/CAC</CardTitle>
              <CardDescription>
                Relação entre o valor do cliente e custo de aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>LTV Médio</TableHead>
                    <TableHead>CAC</TableHead>
                    <TableHead>Razão LTV/CAC</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Básico</TableCell>
                    <TableCell>{formatCurrency(350)}</TableCell>
                    <TableCell>{formatCurrency(120)}</TableCell>
                    <TableCell>2.9</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Aceitável
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Intermediário</TableCell>
                    <TableCell>{formatCurrency(720)}</TableCell>
                    <TableCell>{formatCurrency(150)}</TableCell>
                    <TableCell>4.8</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Excelente
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Premium</TableCell>
                    <TableCell>{formatCurrency(1250)}</TableCell>
                    <TableCell>{formatCurrency(200)}</TableCell>
                    <TableCell>6.3</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Excelente
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell>Média Geral</TableCell>
                    <TableCell>{formatCurrency(773)}</TableCell>
                    <TableCell>{formatCurrency(157)}</TableCell>
                    <TableCell>4.9</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Excelente
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversion" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conversão</CardTitle>
              <CardDescription>
                Evolução da taxa de conversão ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reportData.conversionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Conversão']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="conversionRate" 
                      name="Taxa de Conversão" 
                      stroke="#10b981" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
              <CardDescription>
                Análise do funil de conversão de visitantes para assinantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { stage: 'Visitantes', count: 10000 },
                      { stage: 'Cadastros', count: 2500 },
                      { stage: 'Teste Gratuito', count: 1200 },
                      { stage: 'Assinantes Pagos', count: 350 }
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" width={120} />
                    <Tooltip formatter={(value) => [`${value}`, 'Quantidade']} />
                    <Legend />
                    <Bar dataKey="count" name="Quantidade" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Cadastros / Visitantes</p>
                  <p className="text-xl font-bold text-blue-600">25.0%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Teste / Cadastros</p>
                  <p className="text-xl font-bold text-blue-600">48.0%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Pagos / Teste</p>
                  <p className="text-xl font-bold text-blue-600">29.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conversão por Canal</CardTitle>
              <CardDescription>
                Taxa de conversão segmentada por canal de aquisição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Visitantes</TableHead>
                    <TableHead>Cadastros</TableHead>
                    <TableHead>Assinantes</TableHead>
                    <TableHead>Taxa de Conversão</TableHead>
                    <TableHead>CAC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Orgânico</TableCell>
                    <TableCell>3,245</TableCell>
                    <TableCell>520</TableCell>
                    <TableCell>78</TableCell>
                    <TableCell>2.4%</TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Google Ads</TableCell>
                    <TableCell>4,120</TableCell>
                    <TableCell>865</TableCell>
                    <TableCell>129</TableCell>
                    <TableCell>3.1%</TableCell>
                    <TableCell>{formatCurrency(180)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Facebook</TableCell>
                    <TableCell>2,780</TableCell>
                    <TableCell>695</TableCell>
                    <TableCell>104</TableCell>
                    <TableCell>3.7%</TableCell>
                    <TableCell>{formatCurrency(150)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Indicações</TableCell>
                    <TableCell>850</TableCell>
                    <TableCell>255</TableCell>
                    <TableCell>39</TableCell>
                    <TableCell>4.6%</TableCell>
                    <TableCell>{formatCurrency(50)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Cores para os gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Funções para gerar dados simulados
function generateMRRData() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  return months.map((month, index) => {
    const baseValue = 10000;
    const growth = 1 + (index * 0.15);
    const mrr = Math.round(baseValue * growth);
    const newMrr = Math.round(mrr * 0.2);
    const churnMrr = Math.round(mrr * 0.05);
    
    return {
      month,
      mrr,
      newMrr,
      churnMrr
    };
  });
}

function generateChurnData() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  return months.map((month, index) => {
    const baseChurn = 5;
    const variation = (Math.sin(index) * 1.5);
    const churnRate = baseChurn + variation;
    const netChurn = churnRate - (index * 0.3);
    
    return {
      month,
      churnRate: parseFloat(churnRate.toFixed(1)),
      netChurn: parseFloat(netChurn.toFixed(1))
    };
  });
}

function generateLTVData() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  return months.map((month, index) => {
    const baseLtv = 500;
    const growth = 1 + (index * 0.1);
    const ltv = Math.round(baseLtv * growth);
    
    return {
      month,
      ltv
    };
  });
}

function generateConversionData() {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  return months.map((month, index) => {
    const baseConversion = 3;
    const variation = (Math.cos(index) * 0.5);
    const conversionRate = baseConversion + variation + (index * 0.2);
    
    return {
      month,
      conversionRate: parseFloat(conversionRate.toFixed(1))
    };
  });
}

function generatePlanDistribution(subscriptions: UserSubscriptionWithProfile[]) {
  // Agrupar por plano
  const planGroups = subscriptions.reduce((acc, sub) => {
    const planName = sub.plan?.name || 'Desconhecido';
    if (!acc[planName]) {
      acc[planName] = {
        subscribers: 0,
        revenue: 0
      };
    }
    
    acc[planName].subscribers += 1;
    acc[planName].revenue += (sub.plan?.price_monthly || 0) / 100;
    
    return acc;
  }, {} as Record<string, { subscribers: number, revenue: number }>);
  
  // Se não houver dados reais, gerar dados simulados
  if (Object.keys(planGroups).length === 0) {
    return [
      { name: 'Básico', value: 2990, subscribers: 120, percentage: 30 },
      { name: 'Intermediário', value: 5990, subscribers: 85, percentage: 40 },
      { name: 'Premium', value: 9990, subscribers: 45, percentage: 30 }
    ];
  }
  
  // Calcular total para percentagens
  const totalRevenue = Object.values(planGroups).reduce((sum, group) => sum + group.revenue, 0);
  
  // Converter para formato do gráfico
  return Object.entries(planGroups).map(([name, data]) => ({
    name,
    value: data.revenue,
    subscribers: data.subscribers,
    percentage: (data.revenue / totalRevenue) * 100
  }));
}

function calculateMetrics(subscriptions: UserSubscriptionWithProfile[], mrrData: any[]) {
function calculateMetrics(subscriptions: UserSubscriptionWithProfile[], mrrData: Array<Record<string, number>>) {
  // MRR atual (último mês)
  const mrr = mrrData.length > 0 ? mrrData[mrrData.length - 1].mrr : 0;
  
  // Crescimento do MRR
  const mrrGrowth = mrrData.length > 1 
    ? ((mrrData[mrrData.length - 1].mrr / mrrData[mrrData.length - 2].mrr) - 1) * 100 
    : 0;
  
  // Taxa de churn
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled').length;
  const churnRate = activeSubscriptions > 0 
    ? (cancelledSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100 
    : 0;
  
  // LTV (Lifetime Value)
  const avgMonthlyRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.plan?.price_monthly || 0), 0) / 100 / Math.max(activeSubscriptions, 1);
  
  const ltv = churnRate > 0 ? avgMonthlyRevenue * (100 / churnRate) : avgMonthlyRevenue * 24;
  
  // Taxa de conversão (simulada)
  const conversionRate = 3.5;
  
  return {
    mrr,
    mrrGrowth: parseFloat(mrrGrowth.toFixed(1)),
    churnRate: parseFloat(churnRate.toFixed(1)),
    ltv: parseFloat(ltv.toFixed(2)),
    conversionRate
  };
}

export default ReportsAndMetrics;