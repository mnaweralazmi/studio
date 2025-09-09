
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { AgriculturalSection, SubTopic, VideoSection } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/language-context';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlayCircle, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function TopicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topics, loading: topicsLoading } = useData();
  const [topic, setTopic] = React.useState<AgriculturalSection | null>(null);
  
  const { user } = useAuth();


  React.useEffect(() => {
    if (topics.length > 0 && params.topicId) {
      const currentTopic = topics.find((t: AgriculturalSection) => t.id === params.topicId);
      setTopic(currentTopic || null);
    }
  }, [params.topicId, topics]);
  
  if (topicsLoading) {
    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-12">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        </main>
    );
  }

  if (!topic) {
      return (
         <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
            <p>{t('loading')}...</p>
         </main>
      )
  }

  const title = topic.titleKey === 'custom' ? topic.title : t(topic.titleKey as any);
  const description = topic.descriptionKey === 'custom' ? topic.description : t(topic.descriptionKey as any);

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-12">
        <article>
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
              <ArrowLeft className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              {t('backToHome')}
            </Button>
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground tracking-tight mb-2">
                    {title}
                    </h1>
                    <p className="text-lg text-muted-foreground">{description}</p>
                </div>
            </div>
          </div>
          
            <section className="w-full border-t pt-8">
                <h2 className="text-3xl font-bold text-center mb-8">{t('agriculturalTopics')}</h2>
                {topic.subTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {topic.subTopics.map((subTopic: SubTopic) => {
                        const subTopicTitle = subTopic.titleKey === 'custom' ? subTopic.title : t(subTopic.titleKey as any);
                        const subTopicDescription = subTopic.descriptionKey === 'custom' ? subTopic.description : t(subTopic.descriptionKey as any);
                        return (
                        <Card key={subTopic.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative">
                            <Link href={`/topics/${topic.id}/${subTopic.id}`}>
                                <CardHeader className="p-0 relative">
                                    <Image src={subTopic.image} alt={subTopicTitle!} width={400} height={200} className="w-full h-40 object-cover" data-ai-hint={subTopic.hint} />
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <FileText className="h-12 w-12 text-white/80" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 flex-1 flex flex-col">
                                    <CardTitle className="mb-2 text-lg">
                                        {subTopicTitle}
                                    </CardTitle>
                                    <p className="text-muted-foreground text-sm flex-1">{subTopicDescription!.substring(0, 120)}...</p>
                                </CardContent>
                            </Link>
                        </Card>
                    )})}
                </div>
                 ) : <p className="text-center text-muted-foreground">{t('noSubTopics')}</p>}
            </section>

             {(topic.videos && topic.videos.length > 0) && (
                <section className="w-full border-t pt-12 mt-12">
                    <h2 className="text-3xl font-bold text-center mb-8">{t('educationalVideos')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {topic.videos.map((video: VideoSection) => {
                            const videoTitle = video.titleKey === 'custom' ? video.title : t(video.titleKey as any);
                            const videoDuration = video.durationKey === 'custom' ? video.duration : t(video.durationKey as any);
                            return (
                                <Card key={video.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative">
                                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                        <CardHeader className="p-0 relative">
                                            <Image src={video.image} alt={videoTitle!} width={400} height={200} className="w-full h-40 object-cover" data-ai-hint={video.hint} />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                <PlayCircle className="h-12 w-12 text-white/80" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 flex-1 flex flex-col">
                                            <CardTitle className="mb-2 text-lg">
                                                {videoTitle}
                                            </CardTitle>
                                            <p className="text-muted-foreground text-sm flex-1">{videoDuration}</p>
                                        </CardContent>
                                    </a>
                                </Card>
                        )})}
                    </div>
                </section>
            )}

        </article>
      </div>
    </main>
  );
}
