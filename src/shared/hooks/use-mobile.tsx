import { useState, useEffect } from 'react';

const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Define a largura máxima para dispositivos móveis
    };

    // Define o valor inicial
    handleResize();

    // Adiciona um listener para o evento resize
    window.addEventListener('resize', handleResize);

    // Remove o listener quando o componente é desmontado
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

export default useMobile;
