
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AgriculturalSection, SubTopic } from '@/lib/topics-data';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useTopics } from '@/context/topics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TopicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topics } = useTopics();
  const [topic, setTopic] = React.useState<AgriculturalSection | null>(null);

  React.useEffect(() => {
    if (topics.length > 0 && params.topicId) {
      const currentTopic = topics.find((t: AgriculturalSection) => t.id === params.topicId);
      setTopic(currentTopic || null);
    }
  }, [params.topicId, topics]);

  if (!topic) {
    return <div>{t('loading')}</div>; 
  }

  const title = topic.titleKey === 'custom' && topic.title ? topic.title : t(topic.titleKey as any);
  const description = topic.descriptionKey === 'custom' && topic.description ? topic.description : t(topic.descriptionKey as any);


  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-12">
        <article>
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
              <ArrowLeft className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              {t('backToHome')}
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight mb-2">
              {title}
            </h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          
          <section className="w-full border-t pt-8">
             <h2 className="text-3xl font-bold text-center mb-8">{t('agriculturalTopics')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {topic.subTopics.map((subTopic: SubTopic) => {
                    const subTopicTitle = subTopic.titleKey === 'custom' ? 'Custom Title' : t(subTopic.titleKey as any);
                    const subTopicDescription = subTopic.descriptionKey === 'custom' ? 'Custom Description' : t(subTopic.descriptionKey as any);
                    return (
                    <Link key={subTopic.id} href={`/topics/${topic.id}/${subTopic.id}`} className="group">
                        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                            <CardHeader className="p-0">
                                <Image src={subTopic.image} alt={subTopicTitle} width={600} height={400} className="w-full h-40 object-cover" data-ai-hint={subTopic.hint} />
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <CardTitle className="mb-2 text-lg">
                                    {subTopicTitle}
                                </CardTitle>
                                <p className="text-muted-foreground text-sm flex-1">{subTopicDescription.substring(0, 120)}...</p>
                            </CardContent>
                        </Card>
                    </Link>
                )})}
            </div>
        </section>

        </article>
      </div>
    </main>
  );
}
