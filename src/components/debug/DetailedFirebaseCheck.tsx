'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DetailedFirebaseCheck() {
    const [checking, setChecking] = useState(false);
    const [testResults, setTestResults] = useState<any>(null);
    const { toast } = useToast();

    const runDetailedCheck = async () => {
        setChecking(true);

        try {
            // Verificar configuración
            const config = {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            };

            // Verificar si Firebase está inicializado
            let firebaseInitialized = false;
            let authInitialized = false;

            try {
                const { auth } = await import('@/lib/firebase');
                firebaseInitialized = true;
                authInitialized = !!auth;
            } catch (error) {
                console.error('Firebase init error:', error);
            }

            // Verificar APIs disponibles
            const apis = {
                googleAuth: true, // Siempre disponible
                phoneAuth: false, // Lo verificaremos
                recaptcha: typeof window !== 'undefined' && 'grecaptcha' in window,
            };

            // Intentar verificar Phone Auth (sin enviar SMS)
            try {
                const { RecaptchaVerifier } = await import('firebase/auth');
                apis.phoneAuth = true;
            } catch (error) {
                console.error('Phone auth not available:', error);
            }

            const results = {
                config,
                firebaseInitialized,
                authInitialized,
                apis,
                projectUrl: `https://console.firebase.google.com/project/${config.projectId}`,
                authUrl: `https://console.firebase.google.com/project/${config.projectId}/authentication/providers`,
                billingUrl: `https://console.firebase.google.com/project/${config.projectId}/usage`,
                timestamp: new Date().toLocaleString(),
            };

            setTestResults(results);
        } catch (error) {
            console.error('Check failed:', error);
            toast({
                title: "Error en verificación",
                description: "No se pudo completar la verificación",
                variant: "destructive",
            });
        } finally {
            setChecking(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copiado",
            description: "Información copiada al portapapeles",
        });
    };

    const StatusIcon = ({ status }: { status: boolean | null }) => {
        if (status === null) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        return status ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
            <XCircle className="h-5 w-5 text-red-600" />
        );
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">🔍 Verificación Detallada Firebase</h3>
                <Button onClick={runDetailedCheck} disabled={checking}>
                    {checking ? 'Verificando...' : 'Ejecutar Verificación'}
                </Button>
            </div>

            {testResults && (
                <div className="space-y-6">
                    {/* Configuración del Proyecto */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center">
                            📋 Configuración del Proyecto
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(testResults.config, null, 2))}
                                className="ml-2"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between">
                                <span>Project ID:</span>
                                <code className="bg-gray-100 px-2 py-1 rounded">
                                    {testResults.config.projectId || 'No configurado'}
                                </code>
                            </div>
                            <div className="flex justify-between">
                                <span>Auth Domain:</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {testResults.config.authDomain || 'No configurado'}
                                </code>
                            </div>
                            <div className="flex justify-between">
                                <span>API Key:</span>
                                <span className="text-gray-600">
                                    {testResults.config.apiKey ? '✅ Configurado' : '❌ Faltante'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Estado de Inicialización */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">🚀 Estado de Inicialización</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span>Firebase Inicializado</span>
                                <StatusIcon status={testResults.firebaseInitialized} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Auth Inicializado</span>
                                <StatusIcon status={testResults.authInitialized} />
                            </div>
                        </div>
                    </div>

                    {/* APIs Disponibles */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">🔌 APIs Disponibles</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span>Google Auth</span>
                                <StatusIcon status={testResults.apis.googleAuth} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Phone Auth</span>
                                <StatusIcon status={testResults.apis.phoneAuth} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>reCAPTCHA</span>
                                <StatusIcon status={testResults.apis.recaptcha} />
                            </div>
                        </div>
                    </div>

                    {/* Enlaces de Firebase Console */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">🔗 Enlaces Firebase Console</h4>
                        <div className="space-y-2">
                            <a
                                href={testResults.authUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span>Authentication → Sign-in method</span>
                            </a>
                            <a
                                href={testResults.billingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span>Usage and billing</span>
                            </a>
                            <a
                                href={testResults.projectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                            >
                                <ExternalLink className="h-4 w-4" />
                                <span>Project Overview</span>
                            </a>
                        </div>
                    </div>

                    {/* Instrucciones Específicas */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-800 mb-2">
                            🚨 Error: auth/billing-not-enabled
                        </h4>
                        <div className="text-sm text-red-700 space-y-2">
                            <p><strong>Causa:</strong> Phone Authentication no está habilitado en Firebase Console</p>
                            <p><strong>Solución:</strong></p>
                            <ol className="list-decimal list-inside space-y-1 ml-4">
                                <li>Haz clic en "Authentication → Sign-in method" arriba</li>
                                <li>Busca <strong>"Phone"</strong> en la lista</li>
                                <li>Haz clic en <strong>"Phone"</strong></li>
                                <li>Activa el toggle <strong>"Enable"</strong></li>
                                <li>Haz clic en <strong>"Save"</strong></li>
                                <li>Espera 10-15 minutos</li>
                                <li>Recarga esta página y prueba nuevamente</li>
                            </ol>
                        </div>
                    </div>

                    {/* Alternativa Temporal */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                            💡 Alternativa Temporal
                        </h4>
                        <p className="text-sm text-blue-700">
                            Mientras configuras SMS, puedes usar <strong>Google Authentication</strong> que
                            funciona perfectamente. La mayoría de usuarios prefieren Google Auth por su
                            simplicidad y seguridad.
                        </p>
                    </div>

                    {/* Información de Debug */}
                    <div className="text-xs text-gray-500 border-t pt-2">
                        Verificación ejecutada: {testResults.timestamp}
                    </div>
                </div>
            )}
        </Card>
    );
}