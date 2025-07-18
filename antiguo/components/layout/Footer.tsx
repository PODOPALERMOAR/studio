
// src/components/layout/Footer.tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Footer() {
  return (
    <footer className={cn(
      "py-8",
      "border-t border-solid border-border bg-background" // Updated: Use background color
    )}>
      <nav className="container mx-auto px-4 sm:px-10 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 md:gap-x-9">
        <Link href="/privacy-policy" className="text-sm font-medium leading-normal text-muted-foreground hover:text-primary transition-colors">Privacidad</Link>
        <Link href="/terms-conditions" className="text-sm font-medium leading-normal text-muted-foreground hover:text-primary transition-colors">Términos</Link>
      </nav>
      <div className="text-center text-xs text-muted-foreground mt-6 flex items-center justify-center">
        <span>&copy; {new Date().getFullYear()} Podopalermo</span>
        <Badge variant="outline" className="ml-2 border-primary/30 text-primary bg-primary/10 px-1.5 py-0.5 text-[10px] font-normal">Beta</Badge>
      </div>
    </footer>
  );
}
