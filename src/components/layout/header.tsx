import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';

export default function Header() {
  return (
    <header className={cn(
      "relative flex items-center justify-center whitespace-nowrap px-10 py-3 h-20",
      "border-b border-solid border-border bg-background"
    )}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Link href="/" aria-label="Podopalermo Home">
          <Logo width={72} height={72} />
        </Link>
      </div>
    </header>
  );
}