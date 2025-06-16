import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

/**
 * Tipos para o componente Button
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
  };

/**
 * Interface para componentes de layout
 */
export interface LayoutProps {
  children: ReactNode;
}

/**
 * Interface para componentes com suporte a variantes de estilo
 */
export interface StyleableProps extends HTMLAttributes<HTMLElement> {
  variant?: string;
  size?: string;
  className?: string;
}

/**
 * Interface para componentes de formulário
 */
export interface FormFieldProps {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Interface para componentes de navegação
 */
export interface NavigationItem {
  name: string;
  href: string;
  icon?: ReactNode;
  current?: boolean;
  children?: NavigationItem[];
}

/**
 * Interface para componentes de tabelas
 */
export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: {
    pageSize: number;
    pageIndex: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}