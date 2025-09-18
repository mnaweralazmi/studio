'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import type { User as FirebaseUser } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import {
  Loader2,
  Newspaper,
  Archive,
  User as UserIcon,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '../ui/textarea';

export type Topic = {
  id: string;
  path: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  createdAt?: Timestamp;
  userId?: string;
  authorName?: string;
  authorPhotoURL?: string;
  archived?: boolean;
  likes?: number;
  comments?: number;
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
  onRefresh,
}: {
  user: FirebaseUser;
  topics: Topic[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [likedTopics, setLikedTopics] = useState<Set<string>>(new Set());

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

  const handleLike = async (topicId: string, path: string) => {
    if (!user) return;
    const topicRef = doc(db, path);
    const isLiked = likedTopics.has(topicId);

    try {
      if (isLiked) {
        // Unlike
        await updateDoc(topicRef, { likes: increment(-1) });
        setLikedTopics((prev) => {
          const newSet = new Set(prev);
          newSet.delete(topicId);
          return newSet;
        });
      } else {
        // Like
        await updateDoc(topicRef, { likes: increment(1) });
        setLikedTopics((prev) => new Set(prev).add(topicId));
      }
       // Note: We are not refetching here to avoid a jarring UI update.
       // The UI will update optimistically.
    } catch (e) {
        console.error("Error liking topic: ", e);
    }
  };

  const isVideo = (topic: Topic) => {
    const url = topic.imageUrl;
    if (!url) return false;
    const videoIndicators = ['.mp4', '.mov', '.webm', '.mkv', 'video'];
    const lowercasedUrl = url.toLowerCase();

    try {
      const urlObject = new URL(lowercasedUrl);
      const pathname = urlObject.pathname;
      return videoIndicators.some((ext) => pathname.includes(ext));
    } catch (e) {
      return videoIndicators.some((ext) => lowercasedUrl.includes(ext));
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
          <Newspaper className="h-4 w-4" />
          <AlertTitle>حدث خطأ</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && topics.length === 0 && !error && (
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

      {!loading && topics.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-6">
          {topics.map((topic) => {
            const isLiked = likedTopics.has(topic.id);
            return (
            <Card
              key={topic.id}
              className="overflow-hidden bg-card/70 shadow-md border w-full transition-all hover:border-primary/20"
            >
              <CardHeader className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={topic.authorPhotoURL} alt={topic.authorName} />
                        <AvatarFallback>
                            <UserIcon className="w-5 h-5 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleArchive(topic)}
                      >
                        <Archive className="h-4 w-4" />
                    </Button>
                  )}
              </CardHeader>

              <CardContent className="px-6 pb-4 pt-0">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold leading-snug">
                    {topic.title}
                  </h2>

                  {topic.description && (
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {topic.description}
                    </p>
                  )}

                  {topic.imageUrl && (
                    <div className="relative mt-3 rounded-lg overflow-hidden border">
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

              <CardFooter className="px-6 pb-4 flex flex-col items-start gap-4">
                {/* --- Engagement Stats --- */}
                 <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Heart className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-current' : ''}`}/>
                        <span>{(topic.likes || 0) + (isLiked ? 1 : 0) - (likedTopics.has(topic.id) && !isLiked ? 1: 0) } إعجاب</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4"/>
                        <span>{topic.comments || 0} تعليق</span>
                    </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="w-full grid grid-cols-2 gap-2 border-t pt-2">
                     <Button variant="ghost" className="flex-1" onClick={() => handleLike(topic.id, topic.path)}>
                        <Heart className={`h-5 w-5 ml-2 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
                        {isLiked ? 'أعجبني' : 'إعجاب'}
                    </Button>
                    <Button variant="ghost" className="flex-1">
                        <MessageCircle className="h-5 w-5 ml-2"/>
                        تعليق
                    </Button>
                </div>
                 {/* --- Add Comment Section --- */}
                 <div className="w-full flex items-center gap-2 pt-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user.photoURL || undefined} />
                       <AvatarFallback>
                           <UserIcon className="w-4 h-4" />
                       </AvatarFallback>
                    </Avatar>
                    <Textarea placeholder="اكتب تعليقك..." rows={1} className="flex-1 bg-muted/50 focus-visible:ring-1"/>
                    <Button size="icon" variant="ghost" className="h-9 w-9">
                        <Send className="h-5 w-5"/>
                    </Button>
                 </div>
              </CardFooter>
            </Card>
          )})}
        </div>
      )}
    </section>
  );
}

    