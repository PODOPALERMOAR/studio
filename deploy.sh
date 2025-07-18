#!/bin/bash

# Script para construir y desplegar a Firebase

echo "🏗️ Construyendo la aplicación Next.js..."
npm run build

echo "🔍 Verificando que la carpeta 'out' existe..."
if [ ! -d "out" ]; then
  echo "❌ Error: La carpeta 'out' no se generó. Verifica la configuración de Next.js."
  exit 1
fi

echo "🚀 Desplegando a Firebase..."
firebase deploy --only hosting

echo "✅ Despliegue completado!"