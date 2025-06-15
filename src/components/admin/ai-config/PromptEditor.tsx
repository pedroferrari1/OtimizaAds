
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const PromptEditor = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor de Prompts</CardTitle>
        <CardDescription>
          Editor avançado de prompts com versionamento e testes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <p>Editor de prompts em desenvolvimento</p>
        </div>
      </CardContent>
    </Card>
  );
};
