
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AgriculturalSection, SubTopic } from '@/lib/topics-data';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { useTopics } from '@/context/topics-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SubTopicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topics } = useTopics();
  const [topic, setTopic] = React.useState<AgriculturalSection | null>(null);
  const [subTopic, setSubTopic] = React.useState<SubTopic | null>(null);

  React.useEffect(() => {
    if (topics.length > 0 && params.topicId && params.subTopicId) {
      const currentTopic = topics.find((t: AgriculturalSection) => t.id === params.topicId);
      if (currentTopic) {
        setTopic(currentTopic);
        const currentSubTopic = currentTopic.subTopics.find((st: SubTopic) => st.id === params.subTopicId);
        setSubTopic(currentSubTopic || null);
      }
    }
  }, [params.topicId, params.subTopicId, topics]);

  if (!topic || !subTopic) {
    return <div>{t('loading')}</div>; 
  }

  const title = t(subTopic.titleKey as any);
  const description = t(subTopic.descriptionKey as any);

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        <article>
            <div>
                <Button variant="outline" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                {t('backToTopics', { topicName: t(topic.titleKey as any) })}
                </Button>
            </div>
            
            <Card className="overflow-hidden">
                <div className="relative w-full h-96">
                <Image
                    src={subTopic.image}
                    alt={title}
                    fill
                    style={{objectFit: 'cover'}}
                    data-ai-hint={subTopic.hint}
                />
                </div>
                <div className="p-6 md:p-10">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline text-foreground tracking-tight mb-4">
                    {title}
                    </h1>
                    <div className="prose prose-lg dark:prose-invert max-w-none font-body text-foreground/90">
                        <p>{description}</p>
                        {/* More detailed content can be added here */}
                    </div>
                </div>
            </Card>
        </article>
      </div>
    </main>
  );
}
