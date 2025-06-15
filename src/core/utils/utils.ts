
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Função utilitária para composição de classes do tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
