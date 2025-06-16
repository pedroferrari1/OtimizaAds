import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";
import { useAdGenerator } from "../hooks/useAdGenerator";

const AdGenerator = () => {
  const { 
    productName, 
    setProductName,
    productDescription, 
    setProductDescription,
    targetAudience, 
    setTargetAudience,
    isGenerating,
    generatedAds,
    handleGenerate,
    copyToClipboard,
    copiedIndex
  } = useAdGenerator();

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