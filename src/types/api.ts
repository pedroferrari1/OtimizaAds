/**
 * Tipos para comunicação com a API
 */

// Resultado padrão de operações da API
export interface ApiResult<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Estrutura de erro da API
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Estrutura para paginação
export interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// Resultado paginado
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos para diferentes operações de CRUD
export type CreateOperation<T> = (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<ApiResult<T>>;
export type UpdateOperation<T> = (id: string, data: Partial<T>) => Promise<ApiResult<T>>;
export type DeleteOperation = (id: string) => Promise<ApiResult<void>>;
export type GetOneOperation<T> = (id: string) => Promise<ApiResult<T>>;
export type GetManyOperation<T, P = PaginationParams> = (params: P) => Promise<ApiResult<PaginatedResult<T>>>;