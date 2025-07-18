
"use client"; // Required for useState, useEffect, useRef

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import { Preloader } from '@/components/common/Preloader';
import { cn } from '@/lib/utils';
import { Nunito_Sans } from 'next/font/google';

const nunito_sans = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito-sans',
  weight: ['400', '700', '900'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(true);

  useEffect(() => {
    // Simplified preloader: show for a fixed duration
    const timer = setTimeout(() => {
      setIsGlobalLoading(false);
    }, 750); // Duration for the preloader to be visible

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <html lang="es" className={cn("dark group/design-root", nunito_sans.variable)}>
      <head>
        <title>Podopalermo - Cuidado Profesional de Pies</title>
        <meta name="description" content="Podopalermo - Especialistas en podología. Agenda tu turno online para el cuidado profesional de tus pies en Palermo, Buenos Aires." />
      </head>
      <body className="font-sans antialiased flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        <Preloader isLoading={isGlobalLoading} />
        
        <div 
          className={cn(
            "layout-container flex h-full grow flex-col relative z-0 transition-opacity duration-500 ease-in-out",
            isGlobalLoading ? "opacity-0" : "opacity-100"
          )}
        > 
          <Header />
          <main className="flex-grow container mx-auto px-4 sm:px-10 py-5">
            {children}
          </main>
          <Footer /> 
          <Toaster />
        </div>
      </body>
    </html>
  );
}
