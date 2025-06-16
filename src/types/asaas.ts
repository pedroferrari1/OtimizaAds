// Tipos para a API do Asaas

export interface AsaasCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
  dateCreated?: string;
}

export interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  description?: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELED';
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
  };
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  dateCreated?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  subscription?: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  status?: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  value: number;
  netValue?: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  totalValue?: number;
  installmentValue?: number;
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
  };
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  dateCreated?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
}

export interface AsaasResponse<T> {
  object: string;
  hasMore?: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
  data?: T[];
}

export interface AsaasError {
  code: string;
  message: string;
  description?: string;
}