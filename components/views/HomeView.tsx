'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import type { User as FirebaseUser } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import {
  Loader2,
  Newspaper,
  X,
  AlertCircle,
  Pencil,
  Archive,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Timestamp, doc, updateDoc } from 'firebase/firestore';

type Topic = {
  id: string;
  path: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  createdAt?: Timestamp;
  userId?: string;
  authorName?: string;
  archived?: boolean;
  [k: string]: any;
};

async function archiveTopic(topic: Topic): Promise<void> {
  if (!topic.path) {
     // Fallback for older documents that might not have a path
    const topicRef = doc(db, 'publicTopics', topic.id);
    await updateDoc(topicRef, { archived: true });
    return;
  }
  const topicRef = doc(db, topic.path);
  await updateDoc(topicRef, { archived: true });
}

export default function HomeView({
  user,
  topics,
  loading,
  error,
  onRefresh
}: {
  user: FirebaseUser;
  topics: Topic[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  // Filter out archived topics on the client-side as a fallback
  // Also shows topics where `archived` is undefined (for legacy data)
  const visibleTopics = useMemo(() => topics.filter(topic => topic.archived === false || topic.archived === undefined), [topics]);

  const handleArchive = async (topic: Topic) => {
    try {
      await archiveTopic(topic);
      toast({
        title: 'تمت الأرشفة',
        description: 'تمت أرشفة الموضوع بنجاح.',
        className: 'bg-green-600 text-white',
      });
      onRefresh(); // Refetch topics
    } catch (e: any) {
      console.error('Error archiving topic:', e);
      toast({
        variant: 'destructive',
        title: 'خطأ في الأرشفة',
        description: 'لم نتمكن من أرشفة الموضوع.',
      });
    }
  };

  const isVideo = (topic: Topic) => {
    const url = topic.imageUrl;
    if (!url) return false;
    // Check for common video file extensions or keywords in the URL
    const videoIndicators = ['.mp4', '.mov', '.webm', '.mkv', 'video'];
    const lowercasedUrl = url.toLowerCase();
    
    try {
        const urlObject = new URL(lowercasedUrl);
        const pathname = urlObject.pathname;
        return videoIndicators.some(ext => pathname.includes(ext));
    } catch(e) {
        // Fallback for non-URL strings or data URIs
        return videoIndicators.some(ext => lowercasedUrl.includes(ext));
    }
  };


  return (
    <section>
      {loading && (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-border">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-semibold">
            جاري تحميل المواضيع...
          </h2>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="my-4 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>حدث خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && visibleTopics.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-border max-w-2xl mx-auto">
          <Newspaper className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            لا توجد مواضيع لعرضها حاليًا
          </h2>
          <p className="text-muted-foreground mt-2 mb-4">
            كن أول من يشارك فكرة أو موضوعًا جديدًا!
          </p>
        </div>
      )}

      {!loading && visibleTopics.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-8">
          {visibleTopics.map((topic) => (
            <Card
              key={topic.id}
              className="overflow-hidden bg-card/50 shadow-lg border w-full"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">
                        {topic.authorName}
                      </p>
                      {topic.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(topic.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleArchive(topic)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold leading-snug">
                    {topic.title}
                  </h2>

                  {topic.description && (
                    <p className="text-muted-foreground text-base whitespace-pre-wrap">
                      {topic.description}
                    </p>
                  )}

                  {topic.imageUrl && (
                    <div className="relative mt-4 rounded-lg overflow-hidden border">
                      {isVideo(topic) ? (
                        <video
                          src={topic.imageUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={topic.imageUrl}
                          alt={topic.title || 'Topic Image'}
                          width={800}
                          height={450}
                          className="object-cover w-full h-auto"
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
