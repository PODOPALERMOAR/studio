'use client';

import AuthTest from '@/components/test/AuthTest';
import DetailedFirebaseCheck from '@/components/debug/DetailedFirebaseCheck';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function TestAuthPage() {
    return (
        <div className="flex flex-col items-center w-full min-h-screen">
            <div className="w-full max-w-4xl flex flex-col">
                <Header />
                <main className="flex-grow p-4 space-y-8">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-3xl font-bold text-center mb-8">
                            🔧 Diagnóstico y Prueba de Autenticación
                        </h1>
                        
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-xl font-semibold mb-4">📊 Diagnóstico Firebase</h2>
                                <DetailedFirebaseCheck />
                            </div>
                            
                            <div>
                                <h2 className="text-xl font-semibold mb-4">🧪 Prueba de Auth</h2>
                                <AuthTest />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
}