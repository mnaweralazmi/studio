'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

type Article = {
  id: number;
  title: string;
  description: string;
  image: {
    src: string;
    width: number;
    height: number;
    hint: string;
  };
};

const articles: Article[] = [];

function HomeView() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          أخبار ومواضيع زراعية
        </h1>
        <p className="mt-1 text-muted-foreground">
          ابق على اطلاع بآخر الأخبار والنصائح في عالم الزراعة.
        </p>
      </header>
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden shadow-lg">
              <Image
                src={article.image.src}
                alt={article.title}
                width={article.image.width}
                height={article.image.height}
                className="w-full h-48 object-cover"
                data-ai-hint={article.image.hint}
              />
              <CardHeader>
                <CardTitle>{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  {article.description}
                </p>
                <Button variant="outline" className="w-full">
                  اقرأ المزيد
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <Newspaper className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            لا توجد أخبار حاليًا
          </h2>
          <p className="mt-2 text-muted-foreground">
            سيتم عرض آخر الأخبار والمواضيع الزراعية هنا.
          </p>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <main className="px-4 pt-4">
        <HomeView />
      </main>
      <AppFooter activeView="home" />
    </div>
  );
}
