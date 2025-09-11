'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, Newspaper, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { useAdmin } from '@/lib/hooks/useAdmin';

type Article = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

function HomeView() {
  const [articlesSnapshot, loading, error] = useCollection(
    query(collection(db, 'articles'), orderBy('createdAt', 'desc'))
  );
  const router = useRouter();
  const { isAdmin } = useAdmin();

  const articles =
    articlesSnapshot?.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Article)
    ) || [];

  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">
          جاري تحميل الأخبار...
        </h2>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Newspaper className="h-16 w-16 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-destructive">
            حدث خطأ أثناء تحميل الأخبار
        </h2>
        <p className="mt-2 text-muted-foreground">
          الرجاء المحاولة مرة أخرى لاحقًا.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            أخبار ومواضيع زراعية
          </h1>
          <p className="mt-1 text-muted-foreground">
            ابق على اطلاع بآخر الأخبار والنصائح في عالم الزراعة.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => router.push('/management?tab=content')}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة موضوع
          </Button>
        )}
      </header>
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Image
                src={article.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                alt={article.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={article.imageHint}
              />
              <CardHeader>
                <CardTitle>{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
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
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card rounded-lg border-2 border-dashed">
          <Newspaper className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            لا توجد مواضيع لعرضها
          </h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            سيتم عرض مربعات المواضيع مع الصور والفيديوهات والمحتوى هنا عند إضافتها من قسم إدارة المحتوى.
          </p>
           {isAdmin && (
            <Button onClick={() => router.push('/management?tab=content')} className="mt-6">
                <Plus className="h-4 w-4 ml-2" />
                أضف أول موضوع
            </Button>
        )}
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
