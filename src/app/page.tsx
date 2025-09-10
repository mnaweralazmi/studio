
"use client";

import * as React from 'react';
import { Leaf } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAppContext();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 text-center">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Leaf className="h-5 w-5" />
            <span className="font-semibold text-lg">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('homeHeaderSubtitle')}
          </p>
           {user && (
              <div className='pt-4'>
                <p className='text-lg'>{t('welcome')}, {user.displayName || user.email}!</p>
              </div>
           )}
        </header>
      </div>
    </main>
  );
}
