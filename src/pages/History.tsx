
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  type: "generation" | "diagnosis";
  title: string;
  content: string;
  createdAt: string;
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [historyItems] = useState<HistoryItem[]>([
    {
      id: "1",
      type: "generation",
      title: "Curso de Marketing Digital",
      content: "🔥 Curso de Marketing Digital está aqui! Aprenda as estratégias mais eficazes...",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      type: "diagnosis",
      title: "Análise de Anúncio - Produto Fitness",
      content: "Pontuação: 7.5/10 - O gancho inicial está adequado, mas poderia ser mais impactante...",
      createdAt: "2024-01-14"
    },
    {
      id: "3",
      type: "generation",
      title: "Consultoria Empresarial",
      content: "Transforme sua empresa com nossa consultoria especializada! Mais de 500 empresas...",
      createdAt: "2024-01-13"
    }
  ]);
  
  const { toast } = useToast();

  const filteredItems = historyItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Conteúdo copiado!",
        description: "O texto foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const deleteItem = (id: string) => {
    // TODO: Implement delete functionality
    console.log("Delete item:", id);
    toast({
      title: "Item excluído",
      description: "O item foi removido do seu histórico.",
    });
  };

  const getTypeLabel = (type: string) => {
    return type === "generation" ? "Geração" : "Diagnóstico";
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "generation" ? "default" : "secondary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Histórico</h1>
        <p className="text-gray-600 mt-2">
          Acesse todos os anúncios gerados e diagnósticos realizados anteriormente
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <Badge variant={getTypeBadgeVariant(item.type)}>
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm line-clamp-3">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
              <p className="text-sm">
                {searchTerm ? 
                  "Tente ajustar os termos da busca" : 
                  "Você ainda não tem itens no histórico. Comece gerando ou analisando anúncios!"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;
