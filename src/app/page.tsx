
import * as React from 'react';
import { Leaf, PlayCircle, BookOpen, Droplets, FlaskConical, Bug, Scissors, Sprout } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTopics } from '@/lib/data-fetching'; // Switched to server-side data fetching
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

// Define translations directly for server component
const translations = { ar, en };

const iconComponents: { [key: string]: React.ElementType } = {
  Droplets,
  FlaskConical,
  Bug,
  Scissors,
  Sprout,
  Leaf
};

// This is now a Server Component
export default async function Home() {
  const lang = 'ar'; // Defaulting to Arabic on the server, language can be passed via params later
  const t = (key: keyof typeof ar, params?: Record<string, string>): string => {
    let translation = translations[lang][key] || translations['en'][key] || key;
    if (params) {
      Object.keys(params).forEach(pKey => {
        translation = translation.replace(`{${pKey}}`, params[pKey]);
      });
    }
    return translation;
  };

  const topics = await getTopics();
  
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Leaf className="h-4 w-4" />
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
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">{t('agriculturalTopics')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topics.map((topic) => {
                    const title = topic.titleKey === 'custom' ? topic.title : t(topic.titleKey as any);
                    const description = topic.descriptionKey === 'custom' ? topic.description : t(topic.descriptionKey as any);
                    const video = topic.videos && topic.videos.length > 0 ? topic.videos[0] : null;
                    const Icon = iconComponents[topic.iconName] || Leaf;
                    return (
                        <Card key={topic.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative">
                            <div className="relative w-full h-40">
                                {topic.image && (
                                    <Image 
                                        src={topic.image} 
                                        alt={title!} 
                                        fill 
                                        style={{objectFit: 'cover'}}
                                        data-ai-hint={topic.hint}
                                    />
                                )}
                            </div>
                            <CardContent className="p-4 flex flex-col flex-1">
                                <div className="flex items-center gap-2 mb-2 text-primary">
                                    <Icon className="h-5 w-5" />
                                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                                </div>
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
