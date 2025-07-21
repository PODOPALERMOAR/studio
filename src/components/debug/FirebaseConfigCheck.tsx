'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function FirebaseConfigCheck() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkFirebaseConfig = async () => {
    setChecking(true);
    
    const config = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    };

    const checks = {
      envVars: {
        projectId: !!config.projectId,
        authDomain: !!config.authDomain,
        apiKey: !!config.apiKey,
      },
      projectId: config.projectId,
      authDomain: config.authDomain,
      consoleUrl: `https://console.firebase.google.com/project/${config.projectId}/authentication/providers`,
      billingUrl: `https://console.firebase.google.com/project/${config.projectId}/usage/details`,
    };

    setResults(checks);
    setChecking(false);
  };

  const StatusIcon = ({ status }: { status: boolean }) => (
    status ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )
  );

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
        Diagnóstico Firebase
      </h3>
      
      <Button 
        onClick={checkFirebaseConfig} 
        disabled={checking}
        className="mb-4"
      >
        {checking ? 'Verificando...' : 'Verificar Configuración'}
      </Button>

      {results && (
        <div className="space-y-4">
          {/* Variables de Entorno */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Variables de Entorno</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Project ID</span>
                <div className="flex items-center space-x-2">
                  <StatusIcon status={results.envVars.projectId} />
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {results.projectId || 'No configurado'}
                  </code>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth Domain</span>
                <div className="flex items-center space-x-2">
                  <StatusIcon status={results.envVars.authDomain} />
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {results.authDomain || 'No configurado'}
                  </code>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>API Key</span>
                <div className="flex items-center space-x-2">
                  <StatusIcon status={results.envVars.apiKey} />
                  <span className="text-sm text-gray-600">
                    {results.envVars.apiKey ? 'Configurado' : 'No configurado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Enlaces Firebase Console</h4>
            <div className="space-y-2">
              <a
                href={results.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Authentication → Sign-in method</span>
              </a>
              <a
                href={results.billingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Usage and billing</span>
              </a>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              📋 Para Habilitar SMS Auth:
            </h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Haz clic en "Authentication → Sign-in method" arriba</li>
              <li>Busca "Phone" en la lista de proveedores</li>
              <li>Habilita el toggle (debe quedar azul/verde)</li>
              <li>Guarda los cambios</li>
              <li>Espera 5-10 minutos para que se propague</li>
            </ol>
          </div>

          {/* Error Actual */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">
              ❌ Error Actual: auth/billing-not-enabled
            </h4>
            <p className="text-sm text-red-700">
              Este error indica que Phone Authentication no está habilitado en Firebase Console, 
              incluso si tienes el plan Blaze activo.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}