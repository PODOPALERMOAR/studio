import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { blogPosts, blogCategories } from '@/lib/placeholder-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-headline">Foot Haven Blog</h1>
          <p className="text-muted-foreground mt-2">
            Insights and advice from our podiatry experts.
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search articles..." className="pl-10" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {blogCategories.map(category => (
                    <Button key={category} variant={category === 'All' ? 'default' : 'outline'} className="shrink-0">
                        {category}
                    </Button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="p-0">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={800}
                    height={400}
                    className="w-full h-56 object-cover"
                    data-ai-hint={post.imageHint}
                  />
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <p className="text-sm text-primary font-semibold mb-2">{post.category}</p>
                  <CardTitle className="text-xl font-headline mb-2">{post.title}</CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0 text-sm text-muted-foreground">
                  <span>By {post.author} on {post.date}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
