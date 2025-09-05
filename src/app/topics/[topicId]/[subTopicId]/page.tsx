
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
import { useAuth } from '@/context/auth-context';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubTopicDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { topics, loading: topicsLoading } = useTopics();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = React.useState<AgriculturalSection | null>(null);
  const [subTopic, setSubTopic] = React.useState<SubTopic | null>(null);
  const [isPointsLoading, setIsPointsLoading] = React.useState(true);

  React.useEffect(() => {
    if (topics.length > 0 && params.topicId && params.subTopicId) {
      const currentTopic = topics.find((t: AgriculturalSection) => t.id === params.topicId);
      if (currentTopic) {
        const foundSubTopic = currentTopic.subTopics.find((st: SubTopic) => st.id === params.subTopicId);
        setTopic(currentTopic);
        setSubTopic(foundSubTopic || null);
      }
    }
  }, [params.topicId, params.subTopicId, topics]);

  React.useEffect(() => {
    const awardPoints = async () => {
      if (!user || !subTopic) return;
      
      const viewedTopicKey = `viewed-${subTopic.id}`;
      if (sessionStorage.getItem(viewedTopicKey)) {
        setIsPointsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) {
            throw "User document does not exist!";
          }
          
          const currentBadges = userDoc.data().badges || [];
          let newPoints = userDoc.data().points || 0;
          let newBadges = [...currentBadges];
          let badgeAwarded = false;
          
          if (!currentBadges.includes('explorer')) {
            newPoints += 15; // Points for first article read
            newBadges.push('explorer');
            badgeAwarded = true;
          } else {
            newPoints += 5; // Points for subsequent article reads
          }
          
          const newLevel = Math.floor(newPoints / 100) + 1;
          transaction.update(userRef, { points: newPoints, level: newLevel, badges: newBadges });

          if (badgeAwarded) {
             toast({ title: t('badgeEarned'), description: t('badgeExplorerDesc') });
          }
        });
        sessionStorage.setItem(viewedTopicKey, 'true');
      } catch (error) {
        console.error("Failed to award points:", error);
      } finally {
        setIsPointsLoading(false);
      }
    };

    if (user && subTopic) {
      awardPoints();
    } else if (!user) {
      setIsPointsLoading(false);
    }
  }, [user, subTopic, toast, t]);

  if (topicsLoading || isPointsLoading) {
    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <Skeleton className="h-10 w-48" />
                <Card>
                    <Skeleton className="h-96 w-full" />
                    <div className="p-6 md:p-10 space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </Card>
            </div>
        </main>
    )
  }

  if (!topic || !subTopic) {
    return <div>{t('loading')}</div>; 
  }

  const title = subTopic.titleKey === 'custom' ? subTopic.title : t(subTopic.titleKey as any);
  const description = subTopic.descriptionKey === 'custom' ? subTopic.description : t(subTopic.descriptionKey as any);
  const topicTitle = topic.titleKey === 'custom' ? topic.title : t(topic.titleKey as any);

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        <article>
            <div>
                <Button variant="outline" onClick={() => router.back()} className="mb-6">
                <ArrowLeft className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                {t('backToTopics', { topicName: topicTitle! })}
                </Button>
            </div>
            
            <Card className="overflow-hidden">
                <div className="relative w-full h-96">
                <Image
                    src={subTopic.image}
                    alt={title!}
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
                    </div>
                </div>
            </Card>
        </article>
      </div>
    </main>
  );
}
