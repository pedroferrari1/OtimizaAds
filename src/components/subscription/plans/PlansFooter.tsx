import React from 'react';

interface PlansFooterProps {
  compact?: boolean;
}

const PlansFooter = ({ compact = false }: PlansFooterProps) => {
  if (compact) {
    return null;
  }

  return (
    <div className="text-center mt-12">
      <p className="text-gray-600 mb-4">
        🔒 Todos os planos incluem segurança SSL e backup automático
      </p>
      <p className="text-sm text-gray-500">
        Precisa de algo personalizado? <a href="#" className="text-blue-600 hover:underline">Entre em contato</a>
      </p>
    </div>
  );
};

export default PlansFooter;