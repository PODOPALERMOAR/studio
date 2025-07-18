
// src/config/admins.ts

/**
 * MANIFIESTO DE AUTORIZACIÓN DE ADMINISTRADORES
 * 
 * Esta es la "lista blanca" de números de teléfono (en formato E.164)
 * que tienen permiso para acceder al panel de administrador.
 * 
 * Formato E.164: '+' + [código de país] + [número nacional]
 * Ejemplo Argentina (móvil): "+5491123456789"
 * Ejemplo USA: "+14155552671"
 */
export const adminPhoneNumbers: string[] = [
  // Añade aquí tu número de teléfono para acceder como administrador.
  "+5491100000000", // <-- REEMPLAZA ESTE NÚMERO

  // --- Números de prueba de Firebase para desarrollo ---
  // (El código de verificación para estos siempre es "123456")
  "+16505554355",
];
