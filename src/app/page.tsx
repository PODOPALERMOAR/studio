import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold text-primary font-headline">
              Welcome to Foot Haven
            </h1>
            <p className="mt-4 text-lg text-foreground/80 max-w-prose">
              Your journey to healthier, happier feet starts here. Expert care
              with a natural touch.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/login">Book an Appointment</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/blog">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <Image
              src="https://placehold.co/600x600.png"
              alt="A large, healthy tree representing natural foot care"
              width={600}
              height={600}
              className="rounded-full object-cover shadow-2xl aspect-square"
              data-ai-hint="healthy tree"
              priority
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
