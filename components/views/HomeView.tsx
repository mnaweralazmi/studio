'use client';

import { useMemo, useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import type { User } from 'firebase/auth';

import { Loader2, Newspaper, Trash2, Leaf } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

import AddTopicDialog from '@/components/home/AddTopicDialog';
import NotificationsPopover from '@/components/home/NotificationsPopover';

type Topic = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  fileType?: 'image' | 'video';
  imageHint?: string;
  createdAt: Timestamp;
  ownerId?: string;
  authorName?: string;
};

export default function HomeView({ user }: { user: User }) {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const topicsCollection = collection(db, 'topics');
  const [topicsSnapshot, loading] = useCollection(
    query(topicsCollection, orderBy('createdAt', 'desc'))
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  const topics = useMemo(
    () =>
      topicsSnapshot?.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Topic)
      ) || [],
    [topicsSnapshot]
  );

  const openDeleteConfirmation = (id: string) => {
    setTopicToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await deleteDoc(doc(topicsCollection, topicToDelete));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الموضوع بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (e) {
      console.error('Error deleting topic: ', e);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحذف',
        description: 'لم نتمكن من حذف الموضوع.',
      });
    } finally {
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    }
  };

  const canDelete = (topic: Topic) => {
    if (!user) return false;
    return isAdmin || topic.ownerId === user.uid;
  };

  return (
    <div className="space-y-12">
      <header className="text-center space-y-4 pt-8">
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary-foreground text-sm py-1 px-4"
          >
            <Leaf className="h-4 w-4 ml-2" />
            مزارع كويتي
          </Badge>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground">
          بوابتك لعالم الزراعة
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          اكتشف مقالات وفيديوهات ونصائح الخبراء لمساعدتك في كل خطوة من رحلتك
          الزراعية.
        </p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">المواضيع الزراعية</h2>
          <div className="flex items-center gap-2">
            <AddTopicDialog user={user} />
            <NotificationsPopover user={user} />
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-border">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-semibold">
              جاري تحميل المواضيع...
            </h2>
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-border">
            <Newspaper className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">
              لا توجد مواضيع لعرضها حاليًا
            </h2>
            <p className="text-muted-foreground mt-2">
              كن أول من يشارك فكرة أو موضوعًا جديدًا!
            </p>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {topics.map((topic) => (
              <Card
                key={topic.id}
                className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
              >
                {canDelete(topic) && (
                  <div className="absolute top-2 left-2 z-10 flex gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openDeleteConfirmation(topic.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {topic.imageUrl ? (
                  <Image
                    src={topic.imageUrl}
                    alt={topic.title || 'Topic Image'}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={topic.imageHint}
                  />
                ) : topic.videoUrl ? (
                  <video
                    src={topic.videoUrl}
                    controls
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <Newspaper className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  {topic.authorName && (
                    <p className="text-xs text-muted-foreground">
                      بواسطة: {topic.authorName}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {topic.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا الموضوع بشكل نهائي؟ لا يمكن
              التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteTopic}>
              نعم، قم بالحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
