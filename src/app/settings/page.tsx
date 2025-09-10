"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-context';
import { AppLayout } from '@/components/app-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';


export default function SettingsPage() {
  const { user, loading } = useAppContext();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return null; // The loading state is handled by the AppProvider
  }

  return (
    <AppLayout>
      <main className="flex min-h-screen flex-1 flex-col p-4">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
           <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            الإعدادات
          </h1>
          <Card>
            <CardHeader>
                <CardTitle>صفحة الإعدادات</CardTitle>
            </CardHeader>
            <CardContent>
                <p>هذه هي صفحة الإعدادات. يمكنك إضافة خيارات لتغيير اللغة والمظهر وإدارة الملف الشخصي هنا.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
