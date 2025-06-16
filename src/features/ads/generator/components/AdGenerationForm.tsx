import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdGenerationFormProps {
  productName: string;
  setProductName: (value: string) => void;
  productDescription: string;
  setProductDescription: (value: string) => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
  isGenerating: boolean;
  onGenerate: (e: React.FormEvent) => void;
}

const AdGenerationForm = ({
  productName,
  setProductName,
  productDescription,
  setProductDescription,
  targetAudience,
  setTargetAudience,
  isGenerating,
  onGenerate
}: AdGenerationFormProps) => {
  return (
    <form onSubmit={onGenerate} className="space-y-4">
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
  );
};

export default AdGenerationForm;