'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import AuthDebug from '@/components/debug/AuthDebug';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
      {process.env.NODE_ENV === 'development' && <AuthDebug />}
    </AuthProvider>
  );
}