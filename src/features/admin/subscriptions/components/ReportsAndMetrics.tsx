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
      {/* Rest of the component code... */}
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