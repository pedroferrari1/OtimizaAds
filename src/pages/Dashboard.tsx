
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [userName] = useState("Usuário"); // TODO: Get from auth context

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo, {userName}!</h1>
        <p className="text-gray-600 mt-2">
          Escolha uma das opções abaixo para começar a otimizar seus anúncios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PlusCircle className="h-6 w-6 text-blue-600" />
              <CardTitle>Gerar Anúncios</CardTitle>
            </div>
            <CardDescription>
              Crie variações de texto para seus anúncios a partir das informações do seu produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/app/ad-generator">Começar a Gerar</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Search className="h-6 w-6 text-green-600" />
              <CardTitle>Diagnosticar Anúncio</CardTitle>
            </div>
            <CardDescription>
              Analise um anúncio existente e receba sugestões de otimização personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/app/ad-diagnosis">Analisar Anúncio</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              <CardTitle>Meu Histórico</CardTitle>
            </div>
            <CardDescription>
              Acesse todos os anúncios gerados e diagnósticos realizados anteriormente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/app/history">Ver Histórico</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Dica para iniciantes</h3>
        <p className="text-blue-800 text-sm">
          Comece gerando alguns anúncios para seu produto, depois use o diagnóstico para 
          analisar anúncios que você já possui. A combinação das duas ferramentas vai 
          ajudar você a criar campanhas mais eficazes!
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
