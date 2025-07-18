
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react'; // Keep for type consistency if other props are passed

interface LogoProps extends Omit<LucideProps, 'width' | 'height'> {
  width?: number;
  height?: number;
}

export function Logo({ className, width = 56, height = 56, ...props }: LogoProps) {
  return (
    <div className={cn("relative", className)} style={{ width, height }} {...props}>
      <Image
        src="/images/iso.webp"
        alt="Podopalermo Isotipo"
        fill
        sizes={`${width}px`} // Add sizes prop based on width
        style={{ objectFit: 'contain' }} // Use style prop for objectFit
        priority
      />
    </div>
  );
}
