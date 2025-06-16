import { User, Session } from '@supabase/supabase-js';

/**
 * Interface para o perfil do usuário
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'USER' | 'ADMIN';
  created_at: string;
  updated_at: string;
}

/**
 * Interface para o contexto de autenticação
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: unknown }>;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}