# 🔧 Configuración Google Calendar API para PODOPALERMO

## 📋 Pasos de Configuración

### 1. Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Habilita **Google Calendar API**
4. Ve a **APIs & Services** → **Credentials**

### 2. Crear Service Account
1. Clic en **Create Credentials** → **Service Account**
2. Nombre: `podopalermo-calendar-sync`
3. Descripción: `Sincronización calendarios PODOPALERMO`
4. Clic **Create and Continue**
5. Rol: **Editor** (o Calendar Editor si existe)
6. Clic **Done**

### 3. Generar Clave JSON
1. En la lista de Service Accounts, clic en el email creado
2. Ve a **Keys** tab
3. Clic **Add Key** → **Create New Key**
4. Selecciona **JSON**
5. Descarga el archivo JSON
6. Guárdalo como `service-account-key.json` en tu proyecto

### 4. Compartir Calendarios
Para cada uno de los 7 calendarios, debes:

1. Abrir Google Calendar
2. Buscar el calendario por ID:
   - `6f9ede745ce9d3277a7759b8eb7d85328322e7f471d4d576e7371c298b861caa@group.calendar.google.com`
   - etc.
3. Clic derecho → **Settings and sharing**
4. En **Share with specific people**:
   - Agregar el email de tu Service Account
   - Permisos: **Make changes to events**
5. Clic **Send**

### 5. Variables de Entorno
```bash
# En .env.local
GOOGLE_SERVICE_ACCOUNT_KEY=./service-account-key.json
```

## 🧪 Probar Configuración

Crear página de test:
```
http://localhost:9002/test-calendar
```

## ⚠️ Importante
- El archivo JSON contiene credenciales sensibles
- Nunca lo subas a Git
- Agrégalo a .gitignore