
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { initialAgriculturalSections, AgriculturalSection } from '@/app/page';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug, Droplets, Scissors, Sprout, Wheat } from 'lucide-react';

const iconComponents = {
  Droplets,
  Bug,
  Scissors,
  Sprout,
  Wheat
};

export default function TopicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [topic, setTopic] = React.useState<any | null>(null);
  const [allTopics, setAllTopics] = React.useState<any[]>([]);

  React.useEffect(() => {
    const storedTopics = localStorage.getItem('agriculturalSections');
    const topics = storedTopics ? JSON.parse(storedTopics) : initialAgriculturalSections;
    setAllTopics(topics);

    const currentTopic = topics.find((t: AgriculturalSection) => t.id === params.id);
    if (currentTopic) {
      setTopic(currentTopic);
    }
  }, [params.id]);

  if (!topic) {
    return <div>{t('loading')}</div>; 
  }

  const title = topic.titleKey ? t(topic.titleKey) : topic.title;
  const description = topic.descriptionKey ? t(topic.descriptionKey) : topic.description;

  const otherTopics = allTopics.filter(t => t.id !== topic.id);

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-12">
        <article>
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
              <ArrowLeft className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              {t('backToHome')}
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight mb-4">
              {title}
            </h1>
            <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-xl">
              <Image
                src={topic.image}
                alt={title}
                layout="fill"
                objectFit="cover"
                data-ai-hint={topic.hint}
              />
            </div>
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none font-body text-foreground/90">
            <p>{description}</p>
            {/* You can add more detailed content here in the future */}
          </div>
        </article>

        <section className="w-full border-t pt-12">
            <h2 className="text-3xl font-bold text-center mb-8">{t('otherTopics')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {otherTopics.map((otherTopic) => {
                    const Icon = iconComponents[otherTopic.iconName as keyof typeof iconComponents] || Sprout;
                    const topicTitle = otherTopic.titleKey ? t(otherTopic.titleKey as any) : otherTopic.title;
                    const topicDescription = otherTopic.descriptionKey ? t(otherTopic.descriptionKey as any) : otherTopic.description;
                    return (
                    <Link key={otherTopic.id} href={`/topics/${otherTopic.id}`} className="group">
                        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                            <CardHeader className="p-0">
                                <Image src={otherTopic.image} alt={topicTitle} width={600} height={400} className="w-full h-40 object-cover" data-ai-hint={otherTopic.hint} />
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <CardTitle className="flex items-center gap-2 mb-2 text-lg">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <span>{topicTitle}</span>
                                </CardTitle>
                                <p className="text-muted-foreground text-sm flex-1">{topicDescription.substring(0, 100)}...</p>
                            </CardContent>
                        </Card>
                    </Link>
                )})}
            </div>
        </section>
      </div>
    </main>
  );
}

    