
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdTextFormProps {
  adText: string;
  setAdText: (text: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const AdTextForm = ({ adText, setAdText, isAnalyzing, onAnalyze }: AdTextFormProps) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setAdText(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Texto do Anúncio</CardTitle>
        <CardDescription>
          Cole aqui o texto completo do anúncio que você quer analisar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adText">Texto do Anúncio</Label>
            <Textarea
              id="adText"
              name="adText"
              placeholder="Cole aqui o texto completo do seu anúncio..."
              value={adText}
              onChange={handleTextChange}
              rows={8}
              className="min-h-[200px] resize-none w-full"
              style={{ resize: 'none' }}
              readOnly={false}
              disabled={false}
              autoComplete="off"
              spellCheck={false}
            />
            <div className="text-xs text-gray-500">
              Caracteres digitados: {adText.length}
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isAnalyzing || !adText.trim()}>
            {isAnalyzing ? "Analisando anúncio..." : "Analisar Anúncio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdTextForm;
