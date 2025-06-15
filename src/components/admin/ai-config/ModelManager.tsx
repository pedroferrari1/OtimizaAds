
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const modelSchema = z.object({
  model_name: z.string().min(1, "Nome do modelo é obrigatório"),
  provider: z.string().min(1, "Provedor é obrigatório"),
  model_type: z.enum(["chat", "completion"], {
    required_error: "Tipo do modelo é obrigatório",
  }),
  cost_per_token: z.number().min(0, "Custo deve ser positivo").optional(),
  max_tokens: z.number().min(1, "Máximo de tokens deve ser positivo").optional(),
  supports_streaming: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ModelFormData = z.infer<typeof modelSchema>;

export const ModelManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      model_name: "",
      provider: "",
      model_type: "chat",
      cost_per_token: 0,
      max_tokens: 4096,
      supports_streaming: false,
      is_active: true,
    },
  });

  const { data: models, isLoading } = useQuery({
    queryKey: ["ai-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_models")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (data: ModelFormData) => {
      const { error } = await supabase
        .from("ai_models")
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Modelo criado",
        description: "O modelo foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async (data: ModelFormData) => {
      const { error } = await supabase
        .from("ai_models")
        .update(data)
        .eq("id", editingModel.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      setIsDialogOpen(false);
      setEditingModel(null);
      form.reset();
      toast({
        title: "Modelo atualizado",
        description: "O modelo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const { error } = await supabase
        .from("ai_models")
        .delete()
        .eq("id", modelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      toast({
        title: "Modelo excluído",
        description: "O modelo foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (model: any) => {
    setEditingModel(model);
    form.reset({
      model_name: model.model_name,
      provider: model.provider,
      model_type: model.model_type,
      cost_per_token: model.cost_per_token || 0,
      max_tokens: model.max_tokens || 4096,
      supports_streaming: model.supports_streaming || false,
      is_active: model.is_active || true,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingModel(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ModelFormData) => {
    if (editingModel) {
      updateModelMutation.mutate(data);
    } else {
      createModelMutation.mutate(data);
    }
  };

  const handleDelete = (modelId: string) => {
    if (confirm("Tem certeza que deseja excluir este modelo?")) {
      deleteModelMutation.mutate(modelId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de Modelos</CardTitle>
          <CardDescription>Carregando modelos...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciador de Modelos</CardTitle>
        <CardDescription>
          Adicionar, editar e configurar modelos de IA disponíveis
        </CardDescription>
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Modelo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Modelo</TableHead>
              <TableHead>Provedor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Custo/Token</TableHead>
              <TableHead>Max Tokens</TableHead>
              <TableHead>Streaming</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models?.map((model) => (
              <TableRow key={model.id}>
                <TableCell className="font-medium">{model.model_name}</TableCell>
                <TableCell>{model.provider}</TableCell>
                <TableCell>
                  <Badge variant="outline">{model.model_type}</Badge>
                </TableCell>
                <TableCell>{model.cost_per_token?.toFixed(8) || "0"}</TableCell>
                <TableCell>{model.max_tokens || "N/A"}</TableCell>
                <TableCell>
                  {model.supports_streaming ? (
                    <Badge variant="default">Sim</Badge>
                  ) : (
                    <Badge variant="secondary">Não</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {model.is_active ? (
                    <Badge variant="default">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(model)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingModel ? "Editar Modelo" : "Novo Modelo"}
              </DialogTitle>
              <DialogDescription>
                {editingModel
                  ? "Edite as configurações do modelo de IA"
                  : "Adicione um novo modelo de IA ao sistema"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="model_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: gpt-4o-mini" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provedor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="novita">Novita</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo do Modelo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="chat">Chat</SelectItem>
                            <SelectItem value="completion">Completion</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cost_per_token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo por Token</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.00000001"
                            placeholder="0.00000015"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_tokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Tokens</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="4096"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supports_streaming"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Suporte a Streaming</FormLabel>
                          <FormDescription>
                            O modelo suporta respostas em streaming
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Modelo Ativo</FormLabel>
                          <FormDescription>
                            O modelo está disponível para uso
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createModelMutation.isPending || updateModelMutation.isPending}
                  >
                    {editingModel ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
