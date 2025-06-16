import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AdTextFormProps {
  adText: string;
  setAdText: (text: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const AdTextForm = ({ adText, setAdText, isAnalyzing, onAnalyze }: AdTextFormProps) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setAdText(newValue);
    
    // Limpar mensagem de erro quando o usuário edita o texto
    setErrorMessage(null);
    
    // Verificar limite de caracteres
    if (newValue.length > 1000) {
      setErrorMessage("O texto deve ter no máximo 1000 caracteres");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!adText.trim()) {
      setErrorMessage("Por favor, insira o texto do anúncio");
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira o texto do anúncio para análise.",
        variant: "destructive",
      });
      return;
    }
    
    if (adText.length > 1000) {
      setErrorMessage("O texto deve ter no máximo 1000 caracteres");
      toast({
        title: "Texto muito longo",
        description: "O texto do anúncio deve ter no máximo 1000 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    // Se passou nas validações, continuar com a análise
    setErrorMessage(null);
    onAnalyze();
  };

  const handleFocus = () => {
    if (!hasInteracted) {
      setAdText("");
      setHasInteracted(true);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="bg-white text-gray-900">
        <CardTitle>Texto do Anúncio</CardTitle>
        <CardDescription>
          Cole aqui o texto completo do anúncio que você quer analisar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adText" className="text-gray-700">Texto do Anúncio</Label>
            <Textarea
              id="adText"
              name="adText"
              placeholder="Cole aqui o texto completo do seu anúncio..."
              value={adText}
              onChange={handleTextChange}
              onFocus={handleFocus}
              rows={8}
              className={`min-h-[200px] bg-white border-gray-300 text-gray-900 ${errorMessage ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            <div className="flex justify-between">
              <div className="text-xs text-gray-500">
                Caracteres digitados: {adText.length}{adText.length > 1000 ? ' (limite excedido)' : ''}
              </div>
              {errorMessage && (
                <div className="text-xs text-red-600 font-medium">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isAnalyzing || !adText.trim() || adText.length > 1000}>
            {isAnalyzing ? "Analisando anúncio..." : "Analisar Anúncio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdTextForm;