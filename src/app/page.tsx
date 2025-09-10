"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, loading } = useAppContext();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">
            Welcome, {user.email}!
        </h1>
        <p>The application is now working.</p>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </main>
  );
}
