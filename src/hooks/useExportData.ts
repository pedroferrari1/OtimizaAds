import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ExportOptions {
  filename?: string;
  fileType?: 'csv' | 'json';
  includeTimestamp?: boolean;
}

interface UseExportResult {
  isExporting: boolean;
  exportData: <T>(data: T[], options?: ExportOptions) => Promise<void>;
}

export function useExportData(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  
  const exportData = async <T>(data: T[], options?: ExportOptions): Promise<void> => {
    if (data.length === 0) {
      toast({
        title: "Nada para exportar",
        description: "Não há dados disponíveis para exportação.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      
      const defaultOptions: Required<ExportOptions> = {
        filename: 'exportacao',
        fileType: 'csv',
        includeTimestamp: true,
        ...options
      };
      
      // Adicionar timestamp ao nome do arquivo se especificado
      let filename = defaultOptions.filename;
      if (defaultOptions.includeTimestamp) {
        const timestamp = new Date().toISOString().split('T')[0];
        filename += `-${timestamp}`;
      }
      
      // Adicionar extensão do arquivo
      filename += `.${defaultOptions.fileType}`;
      
      let content: string;
      if (defaultOptions.fileType === 'csv') {
        content = convertToCSV(data);
      } else {
        content = JSON.stringify(data, null, 2);
      }
      
      // Criar o Blob e download
      const blob = new Blob(
        [content], 
        { type: defaultOptions.fileType === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `Os dados foram exportados com sucesso para ${filename}.`,
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return { isExporting, exportData };
}

// Função auxiliar para converter dados para CSV
function convertToCSV<T>(data: T[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => {
    return Object.values(item).map(value => {
      // Escapar strings com vírgulas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      // Converter objetos para JSON
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return value === null || value === undefined ? '' : String(value);
    }).join(',');
  }).join('\n');
  
  return `${headers}\n${rows}`;
}