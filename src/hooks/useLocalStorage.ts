import { useState, useEffect } from "react";

type SetValueFunction<T> = (value: T | ((prevValue: T) => T)) => void;

export function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, SetValueFunction<T>] {
  // Função para obter o valor inicial do localStorage ou usar o initialValue
  const readValue = (): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Erro ao ler localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Estado para armazenar o valor atual
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Função para atualizar o valor no estado e no localStorage
  const setValue: SetValueFunction<T> = value => {
    try {
      // Permitir que o valor seja uma função para seguir o mesmo padrão do useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Salvar no estado
      setStoredValue(valueToStore);
      
      // Salvar no localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Disparar evento para sincronizar entre abas/janelas
        window.dispatchEvent(new Event("local-storage"));
      }
    } catch (error) {
      console.warn(`Erro ao salvar localStorage key "${key}":`, error);
    }
  };

  // Sincronizar com outras abas/janelas
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    // Este evento é disparado quando o localStorage é alterado em outra janela/aba
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleStorageChange);
    };
  }, []);

  return [storedValue, setValue];
}