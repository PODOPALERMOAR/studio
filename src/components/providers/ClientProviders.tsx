'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import AuthDebug from '@/components/debug/AuthDebug';
import { ChatBotProvider } from '@/components/chat/ChatBotContext';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ChatBotProvider>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && <AuthDebug />}
      </ChatBotProvider>
    </AuthProvider>
  );
}
