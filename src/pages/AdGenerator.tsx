
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const AdGenerator = () => {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const saveToHistory = async (inputData: any, generatedAds: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('history_items')
        .insert({
          user_id: user.id,
          type: 'generation',
          title: `Anúncios para ${inputData.productName}`,
          content: generatedAds.join('\n\n---\n\n'),
          input_data: inputData
        });

      if (error) {
        console.error('Error saving to history:', error);
      } else {
        toast({
          title: "Salvo no histórico!",
          description: "Os anúncios foram salvos no seu histórico.",
        });
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // TODO: Integrate with Novita.ai API via Supabase Edge Function
      console.log("Generating ads for:", { productName, productDescription, targetAudience });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock generated ads
      const mockAds = [
        `🔥 ${productName} está aqui! ${productDescription.substring(0, 50)}... Perfeito para ${targetAudience}. Não perca esta oportunidade! 👇`,
        `Você sabia que ${productName} pode transformar sua vida? ${productDescription.substring(0, 40)}... Ideal para ${targetAudience}. Clique e descubra!`,
        `Atenção ${targetAudience}! ${productName} é exatamente o que você precisa. ${productDescription.substring(0, 45)}... Garante já o seu!`,
        `${productName}: A solução que ${targetAudience} estava esperando! ${productDescription.substring(0, 50)}... Aproveite agora!`,
        `Revolucione sua experiência com ${productName}! ${productDescription.substring(0, 40)}... Desenvolvido especialmente para ${targetAudience}.`
      ];
      
      setGeneratedAds(mockAds);
      
      // Save to history
      const inputData = {
        productName,
        productDescription,
        targetAudience
      };
      await saveToHistory(inputData, mockAds);
      
      toast({
        title: "Anúncios gerados com sucesso!",
        description: "5 variações foram criadas para seu produto.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar anúncios",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Texto copiado!",
        description: "O anúncio foi copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerador de Anúncios</h1>
        <p className="text-gray-600 mt-2">
          Preencha as informações do seu produto e gere múltiplas variações de anúncios otimizados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>
              Quanto mais detalhadas as informações, melhores serão os anúncios gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do Produto/Serviço</Label>
                <Input
                  id="productName"
                  placeholder="Ex: Curso de Marketing Digital"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productDescription">Descrição do Produto</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Descreva os principais benefícios, características e diferenciais do seu produto..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Público-Alvo</Label>
                <Input
                  id="targetAudience"
                  placeholder="Ex: Empreendedores iniciantes, Mulheres de 25-40 anos"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? "Gerando anúncios..." : "Gerar Anúncios"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anúncios Gerados</CardTitle>
            <CardDescription>
              {generatedAds.length > 0 ? 
                "Clique no ícone de copiar para usar o texto do anúncio" : 
                "Os anúncios aparecerão aqui após a geração"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedAds.length > 0 ? (
              <div className="space-y-4">
                {generatedAds.map((ad, index) => (
                  <div key={index} className="relative p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-800 pr-8">{ad}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(ad, index)}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                Preencha o formulário e clique em "Gerar Anúncios" para ver os resultados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdGenerator;
