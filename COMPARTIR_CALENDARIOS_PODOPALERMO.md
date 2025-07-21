# 📅 **Compartir Calendarios PODOPALERMO con Service Account**

## 🎯 **Email del Service Account**
```
foot-haven-landing@appspot.gserviceaccount.com
```

## 📋 **Pasos para Compartir Cada Calendario**

### **1. Abrir Google Calendar**
- Ve a [calendar.google.com](https://calendar.google.com)
- Inicia sesión con la cuenta donde están los calendarios de PODOPALERMO

### **2. Para Cada Calendario (7 en total):**

#### **Calendario 1: Podóloga SILVIA**
1. Busca el calendario con ID: `6f9ede745ce9d3277a7759b8eb7d85328322e7f471d4d576e7371c298b861caa@group.calendar.google.com`
2. Clic en los **3 puntos** al lado del nombre del calendario
3. Selecciona **"Settings and sharing"**
4. En la sección **"Share with specific people"**:
   - Clic **"Add people"**
   - Email: `foot-haven-landing@appspot.gserviceaccount.com`
   - Permisos: **"Make changes to events"**
   - Clic **"Send"**

#### **Calendario 2: Podóloga NATALIA**
- ID: `81a0f190b31be19110d69ef0b20e07f5f0d1041d370427e623c51fbe2a47326b@group.calendar.google.com`
- Repetir los mismos pasos

#### **Calendario 3: Podóloga ELIZABETH**
- ID: `296768970b6f1a4c738ce0cf3d7f0bcece6159f8c9fb9d6609cb17aee189c8c7@group.calendar.google.com`
- Repetir los mismos pasos

#### **Calendario 4: Podóloga LORENA**
- ID: `c43f26136a6884b6de70e89b41bc214a3302b7ac504680ae62e1ff27f41419b7@group.calendar.google.com`
- Repetir los mismos pasos

#### **Calendario 5: Podólogo MARTIN**
- ID: `cb98de7b1dc8027f82bdc74f02761a71e681bfc7634756a27ee820e822d05b23@group.calendar.google.com`
- Repetir los mismos pasos

#### **Calendario 6: Podóloga DIANA**
- ID: `4db06585d67cfad764d8a3be208e128581aae5372ee60a8d078459889855f72e@group.calendar.google.com`
- Repetir los mismos pasos

#### **Calendario 7: Podóloga LUCIANA**
- ID: `f5c1fff48d572ef52eddd337fdc4fb8897a4dbb4c35ed4a44192cadc7d063f36@group.calendar.google.com`
- Repetir los mismos pasos

## ✅ **Verificar Configuración**

Una vez compartidos todos los calendarios:

1. Ve a `http://localhost:9002/test-calendar`
2. Clic en **"Probar Conexión Calendarios"**
3. Deberías ver eventos de los 7 calendarios

## 🔍 **Troubleshooting**

### **Si no aparecen eventos:**
1. Verifica que el email del service account esté bien escrito
2. Asegúrate de dar permisos **"Make changes to events"**
3. Espera 5-10 minutos para que se propaguen los permisos
4. Verifica que los calendarios tengan eventos en los próximos 7 días

### **Si hay errores de permisos:**
1. Ve a Google Cloud Console
2. Verifica que Calendar API esté habilitada
3. Verifica que el service account tenga los roles correctos

## 🎯 **Resultado Esperado**

Después de compartir todos los calendarios, el sistema podrá:
- ✅ Leer todos los eventos de los 7 podólogos
- ✅ Detectar turnos con formato `N: nombre T: telefono`
- ✅ Encontrar slots disponibles con título "Ocupar"
- ✅ Crear nuevos turnos cuando los pacientes reserven
- ✅ Sincronizar cambios bidireccionales

---

**🚨 IMPORTANTE:** Una vez compartidos los calendarios, el sistema tendrá acceso completo para leer y modificar eventos. Esto es necesario para la funcionalidad de reserva automática.