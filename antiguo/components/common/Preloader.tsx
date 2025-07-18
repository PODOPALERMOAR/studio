
"use client";
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PreloaderProps {
  isLoading: boolean;
}

export function Preloader({ isLoading }: PreloaderProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true);
      // Wait for fade-out animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // Match this duration with CSS animation
      return () => clearTimeout(timer);
    } else {
      // Reset if isLoading becomes true again
      setShouldRender(true);
      setIsFadingOut(false);
    }
  }, [isLoading]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background text-foreground transition-opacity duration-500 ease-in-out", // Cambiado bg-primary a bg-background
        isFadingOut ? "opacity-0" : "opacity-100"
      )}
    >
      <Logo width={100} height={100} className="animate-pulse" />
    </div>
  );
}
