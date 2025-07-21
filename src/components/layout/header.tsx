'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMounted } from '@/hooks/use-mounted';
import UserMenu from '@/components/auth/UserMenu';
import GoogleOnlyAuthModal from '@/components/auth/GoogleOnlyAuthModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function Header() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const mounted = useMounted();

  return (
    <>
      <header className={cn(
        "relative flex items-center justify-between whitespace-nowrap px-4 sm:px-10 py-3 h-20",
        "border-b border-solid border-border bg-background"
      )}>
        {/* Logo centrado */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" aria-label="Foot Haven Home">
            <Logo width={72} height={72} />
          </Link>
        </div>

        {/* Espacio izquierdo para balance */}
        <div className="w-24"></div>

        {/* Autenticación */}
        <div className="flex items-center">
          {!mounted || loading ? (
            <div className="w-10 h-10 flex items-center justify-center">
              <LoadingSpinner size="sm" />
            </div>
          ) : user ? (
            <UserMenu />
          ) : (
            <Button
              onClick={() => setShowAuthModal(true)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </Button>
          )}
        </div>
      </header>

      <GoogleOnlyAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}