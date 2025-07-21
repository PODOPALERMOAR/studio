# 🔧 Guía Completa: Configurar Autenticación SMS en Firebase

## ❌ Error Actual: `auth/billing-not-enabled`

Este error indica que la autenticación por SMS **NO está completamente configurada** en Firebase Console.

## 📋 Checklist Completo

### 1. ✅ Verificar Plan Blaze
- Ve a [Firebase Console](https://console.firebase.google.com/)
- Selecciona proyecto: `foot-haven-landing`
- **Settings** (⚙️) → **Usage and billing**
- Debe mostrar: **"Blaze Plan"** (no Spark Plan)

### 2. 🔧 Habilitar Phone Authentication
- Ve a **Authentication** → **Sign-in method**
- Busca **"Phone"** en la lista de proveedores
- **Habilitar** el toggle (debe estar en azul/verde)
- **Guardar** los cambios

### 3. 📱 Configurar Números de Prueba (Opcional)
Para desarrollo sin gastar SMS:
- En Phone settings → **Phone numbers for testing**
- Agregar: `+54 11 1234 5678` → Código: `123456`
- Esto permite probar sin SMS reales

### 4. 🌐 Verificar Dominios Autorizados
- En **Authentication** → **Settings** → **Authorized domains**
- Debe incluir: `localhost` y tu dominio de producción

## 🚨 Pasos Críticos

### Paso 1: Verificar Estado Actual
```bash
# Abre Firebase Console
# Ve a: https://console.firebase.google.com/project/foot-haven-landing/authentication/providers
```

### Paso 2: Habilitar Phone Auth
1. Clic en **"Phone"**
2. Toggle **"Enable"** → ON
3. Clic **"Save"**

### Paso 3: Verificar Configuración
- Phone debe aparecer como **"Enabled"** en la lista
- Estado: ✅ **Enabled**

## 🧪 Probar Configuración

### Opción A: Número Real
- Usa tu número real: `11 XXXX XXXX`
- Recibirás SMS con código de 6 dígitos

### Opción B: Número de Prueba
- Configura número de prueba en Console
- Usa código fijo sin SMS real

## 🔍 Debugging

### Si sigue el error `billing-not-enabled`:

1. **Refrescar Firebase Console** (Ctrl+F5)
2. **Esperar 5-10 minutos** después de habilitar
3. **Verificar proyecto correcto**: `foot-haven-landing`
4. **Revisar cuotas**: Settings → Usage and billing → Details

### Comandos de Verificación:
```javascript
// En Console del navegador:
console.log('Firebase Config:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
});
```

## 📞 Contacto Firebase Support

Si el problema persiste:
1. Ve a Firebase Console → **Support**
2. Reporta: "Phone Auth billing-not-enabled despite Blaze plan"
3. Incluye Project ID: `foot-haven-landing`

## ⚡ Solución Temporal

Mientras tanto, puedes:
1. **Usar solo Google Auth** (funciona perfectamente)
2. **Deshabilitar SMS** en el modal temporalmente
3. **Probar en producción** (a veces funciona diferente)

---

**🎯 Objetivo**: Que Phone aparezca como "Enabled" en Authentication → Sign-in method