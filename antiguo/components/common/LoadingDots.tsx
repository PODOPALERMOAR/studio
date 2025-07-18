
"use client";

import { cn } from "@/lib/utils";

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1.5 items-center", className)}>
      <span className="sr-only">Cargando...</span>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  );
}
