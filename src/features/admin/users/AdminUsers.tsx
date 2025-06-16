import { useState, useEffect } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, UserCheck, UserX } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'USER' | 'ADMIN';
  created_at: string;
  updated_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'activate' | 'deactivate' | 'makeAdmin' | 'removeAdmin';
    user: User | null;
  }>({
    open: false,
    type: 'activate',
    user: null,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!actionDialog.user) return;

    try {
      let updateData: any = {};

      switch (actionDialog.type) {
        case 'makeAdmin':
          updateData = { role: 'ADMIN' };
          break;
        case 'removeAdmin':
          updateData = { role: 'USER' };
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', actionDialog.user.id);

      if (error) {
        throw error;
      }

      // Log da ação
      await supabase.from('audit_logs').insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        action: actionDialog.type === 'makeAdmin' ? 'user_promoted_to_admin' : 'user_removed_from_admin',
        target_user_id: actionDialog.user.id,
        details: { 
          user_email: actionDialog.user.email,
          previous_role: actionDialog.user.role,
          new_role: updateData.role 
        }
      });

      toast({
        title: "Operação realizada com sucesso",
        description: `Usuário ${actionDialog.type === 'makeAdmin' ? 'promovido a admin' : 'removido da função admin'} com sucesso.`,
      });

      // Atualizar lista
      await fetchUsers();
      setActionDialog({ open: false, type: 'activate', user: null });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      key: 'email' as keyof User,
      header: 'Email',
    },
    {
      key: 'full_name' as keyof User,
      header: 'Nome',
      render: (value: any) => value || 'N/A',
    },
    {
      key: 'role' as keyof User,
      header: 'Função',
      render: (value: any) => (
        <Badge variant={value === 'ADMIN' ? 'default' : 'secondary'}>
          {value === 'ADMIN' ? 'Administrador' : 'Usuário'}
        </Badge>
      ),
    },
    {
      key: 'created_at' as keyof User,
      header: 'Data de Cadastro',
      render: (value: any) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      key: 'id' as keyof User,
      header: 'Ações',
      render: (value: any, user: User) => (
        <div className="flex gap-2">
          {user.role === 'USER' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setActionDialog({
                  open: true,
                  type: 'makeAdmin',
                  user,
                });
              }}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Tornar Admin
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setActionDialog({
                  open: true,
                  type: 'removeAdmin',
                  user,
                });
              }}
            >
              <UserX className="h-4 w-4 mr-1" />
              Remover Admin
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-2">
            Visualize e gerencie todos os usuários da plataforma
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline">
          Atualizar Lista
        </Button>
      </div>

      <DataTable
        data={users}
        columns={columns}
        searchKey="email"
        searchPlaceholder="Buscar por email..."
        loading={loading}
        onRowClick={(user) => setSelectedUser(user)}
      />

      {/* Dialog de Confirmação */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <DialogTitle>Confirmar Ação</DialogTitle>
            </div>
            <DialogDescription>
              {actionDialog.type === 'makeAdmin' && (
                <>
                  Você está prestes a promover <strong>{actionDialog.user?.email}</strong> a
                  administrador. Esta ação dará acesso total ao painel administrativo.
                </>
              )}
              {actionDialog.type === 'removeAdmin' && (
                <>
                  Você está prestes a remover <strong>{actionDialog.user?.email}</strong> da
                  função de administrador. O usuário perderá acesso ao painel administrativo.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, type: 'activate', user: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleUserAction}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;