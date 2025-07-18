import Image from 'next/image';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { blogPosts } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-10">
        <article className="container mx-auto px-4 max-w-4xl">
          <header className="mb-8">
            <Badge variant="secondary" className="mb-2">{post.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-headline leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-muted-foreground">
              Posted by {post.author} on {post.date}
            </p>
          </header>
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={1200}
            height={600}
            className="w-full rounded-lg shadow-lg object-cover aspect-video mb-8"
            data-ai-hint={post.imageHint}
            priority
          />
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-headline prose-a:text-primary hover:prose-a:text-primary/80"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
