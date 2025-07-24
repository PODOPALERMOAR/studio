import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
  // Remover todos los caracteres no numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Si empieza con 0, removerlo
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Si no empieza con 54 (código de Argentina), agregarlo
  if (!cleaned.startsWith('54')) {
    cleaned = '54' + cleaned;
  }
  
  // Agregar el + al inicio
  return '+' + cleaned;
}

export function formatDisplayPhone(phone: string): string {
  // Remover el código de país para mostrar
  const cleaned = phone.replace(/^\+54/, '');
  
  // Formatear como (11) 1234-5678
  if (cleaned.length >= 10) {
    const areaCode = cleaned.substring(0, 2);
    const firstPart = cleaned.substring(2, 6);
    const secondPart = cleaned.substring(6, 10);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  return phone;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Validar que tenga al menos 10 dígitos después del código de país
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
}
