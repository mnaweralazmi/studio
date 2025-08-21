
"use client";

import * as React from 'react';
import * as Lucide from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { useTopics } from '@/context/topics-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PlantingPlanGenerator } from '@/components/planting-plan-generator';

const getIcon = (name: string) => {
    const Icon = Lucide[name as keyof typeof Lucide] as React.ElementType;
    return Icon ? <Icon className="h-8 w-8" /> : <Lucide.Leaf className="h-8 w-8" />;
};

export default function Home() {
  const { t, language } = useLanguage();
  const { topics } = useTopics();
  
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Lucide.Leaf className="h-4 w-4" />
            <span className="font-semibold">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>
        
        <section className="w-full">
            <PlantingPlanGenerator />
        </section>

        <Separator className="my-8" />

        <section className="w-full border-t pt-8">
            <h2 className="text-3xl font-bold text-center mb-8">{t('agriculturalTopics')}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topics.map((topic) => {
                    const title = topic.titleKey === 'custom' ? topic.title : t(topic.titleKey as any);
                    const description = topic.descriptionKey === 'custom' ? topic.description : t(topic.descriptionKey as any);
                    const video = topic.videos && topic.videos.length > 0 ? topic.videos[0] : null;
                    return (
                        <Card key={topic.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                            <div className="relative w-full h-40">
                                <Image 
                                    src={topic.image} 
                                    alt={title!} 
                                    fill 
                                    style={{objectFit: 'cover'}}
                                    data-ai-hint={topic.hint}
                                />
                            </div>
                            <CardContent className="p-4 flex flex-col flex-1">
                                <h3 className="text-lg font-bold mb-2">{title}</h3>
                                <p className="text-muted-foreground text-sm flex-1">{description}</p>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Button asChild size="sm">
                                        <Link href={`/topics/${topic.id}`}>
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            {t('readMore')}
                                        </Link>
                                    </Button>
                                    {video && (
                                        <Button asChild variant="secondary" size="sm">
                                            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                {t('watchVideo')}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
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
