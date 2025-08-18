
"use client";

import * as React from 'react';
import * as Lucide from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';

const quickAccessTopics = [
    { id: '1', titleKey: 'topicIrrigation', iconName: 'Droplets' },
    { id: '2', titleKey: 'topicPests', iconName: 'Bug' },
    { id: '3', titleKey: 'topicPruning', iconName: 'Scissors' },
    { id: '4', titleKey: 'topicSoil', iconName: 'Sprout' }
];

const getIcon = (name: string) => {
    const Icon = Lucide[name as keyof typeof Lucide] as React.ElementType;
    return Icon ? <Icon className="h-8 w-8" /> : <Lucide.Leaf className="h-8 w-8" />;
};

export default function Home() {
  const { t } = useLanguage();
  
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Lucide.Leaf className="h-5 w-5" />
            <span className="font-semibold">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>
        
        <section className="w-full border-t pt-8">
            <h2 className="text-3xl font-bold text-center mb-8">{t('agriculturalTopics')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {quickAccessTopics.map((topic) => {
                    const title = t(topic.titleKey as any);
                    return (
                        <Link key={topic.id} href={`/topics/${topic.id}`} className="flex flex-col items-center gap-3 text-center group">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary/20 group-hover:scale-110">
                                {getIcon(topic.iconName)}
                            </div>
                            <p className="font-semibold text-sm text-foreground">{title}</p>
                        </Link>
                    )
                })}
            </div>
        </section>

        <footer className="text-center mt-16 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}
