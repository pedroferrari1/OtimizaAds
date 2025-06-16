import { User, Session } from '@supabase/supabase-js';

/**
 * Tipo para o perfil de usuário
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

/**
 * Enum para as funções de usuário
 */
export type UserRole = 'USER' | 'ADMIN';

/**
 * Interface para o contexto de autenticação
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

/**
 * Interface para as propriedades de rota protegida
 */
export interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Interface para o estado de autenticação
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

/**
 * Interface para os dados de registro de usuário
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}