/**
 * Formata um valor monetário para exibição em Real brasileiro
 * @param value Valor em centavos
 * @returns Valor formatado como moeda
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
}

/**
 * Formata um número com separadores de milhar
 * @param value Número a ser formatado
 * @param decimalPlaces Número de casas decimais (opcional)
 * @returns Número formatado
 */
export function formatNumber(value: number, decimalPlaces: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
}

/**
 * Formata um CPF ou CNPJ
 * @param value Valor a ser formatado
 * @returns CPF ou CNPJ formatado
 */
export function formatDocument(value: string): string {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');
  
  if (numericValue.length <= 11) {
    // Formato CPF: 000.000.000-00
    return numericValue
      .padStart(11, '0')
      .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  } else {
    // Formato CNPJ: 00.000.000/0000-00
    return numericValue
      .padStart(14, '0')
      .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
}

/**
 * Formata um número de telefone
 * @param value Valor a ser formatado
 * @returns Telefone formatado
 */
export function formatPhone(value: string): string {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');
  
  // Verifica se é um celular (9 dígitos) ou telefone fixo (8 dígitos)
  if (numericValue.length === 11) {
    // Formato celular: (00) 00000-0000
    return numericValue.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else {
    // Formato telefone fixo: (00) 0000-0000
    return numericValue.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
}

/**
 * Formata um CEP
 * @param value Valor a ser formatado
 * @returns CEP formatado
 */
export function formatPostalCode(value: string): string {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');
  
  // Formato CEP: 00000-000
  return numericValue
    .padStart(8, '0')
    .replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Trunca um texto adicionando reticências se necessário
 * @param text Texto a ser truncado
 * @param maxLength Comprimento máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Formata um tamanho de arquivo em KB, MB, GB
 * @param bytes Tamanho em bytes
 * @returns Tamanho formatado
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}