# Configuración SMS Firebase

## Error: auth/billing-not-enabled

Este error aparece porque Firebase requiere el **Blaze Plan** (plan de pago) para usar autenticación por SMS.

### Solución 1: Habilitar Blaze Plan

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `foot-haven-landing`
3. Ve a **Settings** → **Usage and billing**
4. Haz clic en **Modify plan**
5. Selecciona **Blaze Plan** (Pay as you go)
6. Configura tu método de pago

### Costos SMS
- **Verificación SMS**: ~$0.05 USD por SMS
- **Cuota gratuita**: Primeros 10,000 verificaciones/mes gratis
- Para desarrollo: costo mínimo

### Después de habilitar Blaze:
1. Ve a **Authentication** → **Sign-in method**
2. Habilita **Phone** como proveedor
3. Configura números de prueba si necesitas (opcional)

### Números de Prueba (Desarrollo)
En Authentication → Sign-in method → Phone → Add test phone number:
- Número: +54 11 1234 5678
- Código: 123456

Esto te permite probar sin enviar SMS reales.