"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AppLayout } from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Home() {
  const { user, loading } = useAppContext();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return null; // The loading state is handled by the Providers component
  }

  return (
    <AppLayout>
      <main className="flex min-h-screen flex-1 flex-col p-4">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
           <h1 className="text-2xl font-bold">
            مرحباً بك، {user.displayName || user.email}!
          </h1>
          <Card>
            <CardHeader>
                <CardTitle>الصفحة الرئيسية</CardTitle>
            </CardHeader>
            <CardContent>
                <p>هذا هو الهيكل الجديد والبسيط لتطبيقك. يمكنك البناء على هذه الصفحات الأساسية.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
