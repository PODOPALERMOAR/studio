# Configuración del Proyecto

## Variables de Entorno Necesarias

Copia `.env.example` a `.env.local` y completa con tus credenciales:

### Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Project Settings → General → Your apps
4. Copia la configuración de Firebase

### Google AI (Gemini)
1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Crea una API Key
3. Cópiala en `GOOGLE_GENAI_API_KEY`

## Para Firebase Studio
Cuando subas el código a Firebase Studio, configura las variables de entorno en:
- Firebase Studio → Environment Variables
- O usando Firebase CLI: `firebase functions:config:set`

## Comandos de Desarrollo
```bash
npm run dev          # Servidor de desarrollo
npm run genkit:dev   # Genkit development server
npm run build        # Build para producción
```