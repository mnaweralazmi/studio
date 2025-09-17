'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import HomeView from '@/components/views/HomeView';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

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
                <AlertTitle className="text-xl font-bold">وصول مرفوض</AlertTitle>
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
        <HomeView user={user} />
      </main>
      <AppFooter activeView="home" />
      <Toaster />
    </div>
  );
}
