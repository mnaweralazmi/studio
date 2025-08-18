
"use client";

import * as React from 'react';
import { Droplets, Bug, Scissors, Sprout, Leaf } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';


const quickAccessTopics = [
    { id: '1', titleKey: 'topicIrrigation', icon: Droplets, href: '/topics/1' },
    { id: '2', titleKey: 'topicPests', icon: Bug, href: '/topics/2' },
    { id: '3', titleKey: 'topicPruning', icon: Scissors, href: '/topics/3' },
    { id: '4', titleKey: 'topicSoil', icon: Sprout, href: '/topics/4' },
]


export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12 text-center">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Leaf className="h-5 w-5" />
            <span className="font-semibold">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-2xl">
            {quickAccessTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                     <Link href={topic.href} key={topic.id} className="group flex flex-col items-center gap-2 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary/20 group-hover:scale-110">
                            <Icon className="h-8 w-8" />
                        </div>
                        <p className="font-semibold text-sm text-foreground">{t(topic.titleKey as any)}</p>
                    </Link>
                )
            })}
        </div>

        <footer className="text-center mt-16 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}
