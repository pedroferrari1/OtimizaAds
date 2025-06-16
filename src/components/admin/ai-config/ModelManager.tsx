import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, FormHelperText } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, AlertCircle, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

// Define the type for database insert - ensuring required fields are not optional
type ModelInsertData = {
  model_name: string;
  provider: string;
  model_type: "chat" | "completion";
  cost_per_token?: number;
  max_tokens?: number;
  supports_streaming?: boolean;
  is_active?: boolean;
};

export const ModelManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  // Função para verificar se o nome do modelo já existe
  const checkModelNameExists = (modelName: string, excludeId?: string) => {
    if (!models) return false;
    return models.some(model => 
      model.model_name.toLowerCase() === modelName.toLowerCase() && 
      model.id !== excludeId
    );
  };

  const createModelMutation = useMutation({
    mutationFn: async (data: ModelFormData) => {
      // Verificar se o nome do modelo já existe
      if (checkModelNameExists(data.model_name)) {
        throw new Error(`Já existe um modelo com o nome "${data.model_name}". Por favor, escolha um nome diferente.`);
      }

      // Ensure all required fields are present and convert to the correct insert type
      // Verificar se o modelo já existe
      const { data: existingModel, error: checkError } = await supabase
        .from("ai_models")
        .select("id")
        .eq("model_name", data.model_name)
        .maybeSingle();
        
      if (existingModel) {
        throw new Error("Um modelo com este nome já existe. Por favor, escolha um nome diferente.");
      }
      
      const insertData: ModelInsertData = {
        model_name: data.model_name,
        provider: data.provider,
        model_type: data.model_type,
        cost_per_token: data.cost_per_token,
        max_tokens: data.max_tokens,
        supports_streaming: data.supports_streaming,
        is_active: data.is_active,
      };

      const { error } = await supabase
        .from("ai_models")
        .insert(insertData);

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
      // Verificar se o modelo já existe com este nome (exceto o próprio modelo)
      if (editingModel) {
        const { data: existingModel, error: checkError } = await supabase
          .from("ai_models")
          .select("id")
          .eq("model_name", data.model_name)
          .neq("id", editingModel.id)
          .maybeSingle();
          
        if (existingModel) {
          throw new Error("Um modelo com este nome já existe. Por favor, escolha um nome diferente.");
        }
      }
      
      // Verificar se o nome do modelo já existe (excluindo o modelo atual)
      if (checkModelNameExists(data.model_name, editingModel?.id)) {
        throw new Error(`Já existe um modelo com o nome "${data.model_name}". Por favor, escolha um nome diferente.`);
      }

      const updateData: ModelInsertData = {
        model_name: data.model_name,
        provider: data.provider,
        model_type: data.model_type,
        cost_per_token: data.cost_per_token,
        max_tokens: data.max_tokens,
        supports_streaming: data.supports_streaming,
        is_active: data.is_active,
      };

      const { error } = await supabase
        .from("ai_models")
        .update(updateData)
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
    mutationFn: async (model: any) => {
      // Verificar se o modelo está sendo usado em alguma configuração
      const { data: usages, error: usageError } = await supabase
        .from("ai_configurations")
        .select("id")
        .eq("model_id", model.id);
      
      if (usageError) throw usageError;
      
      if (usages && usages.length > 0) {
        throw new Error(`Este modelo está sendo usado em ${usages.length} configurações e não pode ser excluído.`);
      }
      
      // Se não estiver em uso, podemos excluir
      const { error } = await supabase
        .from("ai_models")
        .update({ is_active: false })
        .eq("id", model.id);

      if (error) throw error;
      
      // Registrar no log de auditoria
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'model_deactivated',
        details: { 
          model_name: model.model_name,
          provider: model.provider
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      toast({
        title: "Modelo desativado",
        description: "O modelo foi desativado com sucesso.",
      });
      setConfirmDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao desativar modelo",
        description: error.message,
        variant: "destructive",
      });
      setConfirmDelete(null);
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

  const handleDelete = (model: any) => {
    setConfirmDelete(model.id);
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
                      onClick={() => handleDelete(model)}
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
                      <FormDescription>
                        O nome deve ser único no sistema
                      </FormDescription>
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
      
      {/* Diálogo de confirmação para desativação */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Confirmar Desativação
            </DialogTitle>
            <DialogDescription>
              Você está prestes a desativar este modelo. Isso o tornará indisponível para novas configurações.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  Por segurança, os modelos não são excluídos permanentemente, apenas desativados.
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Isso preserva a integridade dos dados históricos e configurações existentes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                const model = models?.find(m => m.id === confirmDelete);
                if (model) {
                  deleteModelMutation.mutate(model);
                }
              }}
              disabled={deleteModelMutation.isPending}
            >
              {deleteModelMutation.isPending ? "Desativando..." : "Desativar Modelo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};