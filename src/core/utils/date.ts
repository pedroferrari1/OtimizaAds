import { format, formatDistance, formatRelative, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para exibição amigável em português
 * @param date Data a ser formatada
 * @param formatString String de formatação (opcional)
 * @returns Data formatada
 */
export function formatDate(date: Date | string, formatString: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString, { locale: ptBR });
}

/**
 * Formata uma data para exibição amigável em português com horário
 * @param date Data a ser formatada
 * @returns Data formatada com horário
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
}

/**
 * Retorna uma string relativa para a data (ex: "há 5 minutos", "ontem")
 * @param date Data a ser formatada
 * @param baseDate Data base para comparação (opcional)
 * @returns Texto relativo
 */
export function formatRelativeTime(date: Date | string, baseDate: Date = new Date()): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(dateObj, baseDate, { locale: ptBR });
}

/**
 * Formata a distância entre duas datas (ex: "5 minutos", "3 dias")
 * @param date Data a ser comparada
 * @param baseDate Data base para comparação (opcional)
 * @param includeSeconds Se deve incluir segundos na formatação (opcional)
 * @returns Texto de distância
 */
export function formatTimeDistance(
  date: Date | string, 
  baseDate: Date = new Date(),
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, baseDate, { 
    locale: ptBR,
    includeSeconds,
    addSuffix: true
  });
}

/**
 * Formata uma data para exibição inteligente baseado na proximidade
 * @param date Data a ser formatada
 * @returns Texto formatado
 */
export function formatSmartDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Hoje às ${format(dateObj, 'HH:mm', { locale: ptBR })}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Ontem às ${format(dateObj, 'HH:mm', { locale: ptBR })}`;
  }
  
  if (isThisWeek(dateObj)) {
    return format(dateObj, "EEEE 'às' HH:mm", { locale: ptBR });
  }
  
  if (isThisMonth(dateObj)) {
    return format(dateObj, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  }
  
  return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}