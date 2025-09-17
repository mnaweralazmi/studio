'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import HomeView from '@/components/views/HomeView';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import AdMarquee from '@/components/home/AdMarquee';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';

type Topic = {
  id: string;
  path: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  createdAt?: Timestamp;
  userId?: string;
  authorName?: string;
  archived?: boolean;
  [k: string]: any;
};

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    if (!isAdmin) {
      setTopicsLoading(false);
      return;
    }
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const topicsCollectionRef = collection(db, 'publicTopics');
      const q = query(topicsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const allTopics = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        path: doc.ref.path,
        ...doc.data(),
      })) as Topic[];
      
      setTopics(allTopics);
    } catch (e: any) {
      console.error('Error fetching topics:', e);
      if (e.code === 'failed-precondition') {
        setTopicsError(
          'حدث خطأ في قاعدة البيانات. قد يتطلب هذا الاستعلام فهرسًا مخصصًا. يرجى مراجعة سجلات Firestore.'
        );
      } else {
        setTopicsError(
          'حدث خطأ أثناء جلب المواضيع. قد تكون مشكلة في الاتصال أو صلاحيات الوصول.'
        );
      }
    } finally {
      setTopicsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if(!adminLoading && isAdmin){
        fetchTopics();
    }
  }, [adminLoading, isAdmin, fetchTopics]);


  if (loading || !user || adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pb-24">
        <main className="px-4 pt-4 container mx-auto flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <Alert variant="destructive" className="border-0">
                <ShieldAlert className="h-6 w-6" />
                <AlertTitle className="text-xl font-bold">
                  وصول مرفوض
                </AlertTitle>
                <AlertDescription className="mt-2">
                  هذه الصفحة مخصصة للمسؤولين فقط. لا تملك الصلاحيات اللازمة
                  لعرض هذا المحتوى.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </main>
        <AppFooter activeView="home" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      <main className="px-4 pt-4 container mx-auto">
        <header className="flex flex-col items-center justify-between pt-8 sm:flex-row mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            المواضيع والنقاشات
          </h1>
        </header>

        <AdMarquee />

        <HomeView
          user={user}
          topics={topics}
          loading={topicsLoading}
          error={topicsError}
          onRefresh={fetchTopics}
        />
      </main>
      <AppFooter activeView="home" />
      <Toaster />
    </div>
  );
}
