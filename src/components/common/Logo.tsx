import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface LogoProps extends HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
}

export function Logo({ className, width = 56, height = 56, ...props }: LogoProps) {
  return (
    <div className={cn("relative", className)} style={{ width, height }} {...props}>
      <Image
        src="/images/isooriginal.webp"
        alt="Podopalermo Logo"
        fill
        sizes={`${width}px`}
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}