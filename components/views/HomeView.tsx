'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  Timestamp,
  addDoc,
  getDoc,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { db, storage } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import type { User } from 'firebase/auth';
import { useCollection } from 'react-firebase-hooks/firestore';

import { Loader2, Newspaper, Trash2, Leaf, Plus, X } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
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

  // State for AddTopicDialog
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Revoke previous URL if it exists
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setFile(undefined);
      setPreview(undefined);
    }
  };

  const clearFile = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(undefined);
    setPreview(undefined);
    const fileInput = document.getElementById('idea-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [preview]);

  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    clearFile();
  }, [clearFile]);

  // Cleanup effect for object URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleSave = async () => {
    if (!title.trim() || !user) {
      return;
    }
    setIsSaving(true);
    try {
      const authorName = user.displayName || 'مستخدم غير معروف';

      const topicData: DocumentData = {
        title: title,
        description: description,
        ownerId: user.uid,
        authorName: authorName,
        createdAt: new Date(),
      };

      if (file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        const filePath = `topics/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        if (fileType === 'image') {
          topicData.imageUrl = fileUrl;
        } else {
          topicData.videoUrl = fileUrl;
        }
        topicData.fileType = fileType;
      }

      await addDoc(collection(db, 'topics'), topicData);

      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });

      clearForm();
      setDialogOpen(false);
    } catch (e) {
      console.error('Error saving topic: ', e);
      toast({
        variant: 'destructive',
        title: 'خطأ في النشر',
        description: 'لم نتمكن من نشر موضوعك. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSaving(false);
    }
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
            <Dialog
              open={dialogOpen}
              onOpenChange={(isOpen) => {
                setDialogOpen(isOpen);
                if (!isOpen) {
                  clearForm();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 ml-2" />
                  أضف فكرتك
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>أضف فكرة أو موضوع جديد</DialogTitle>
                  <DialogDescription>
                    شارك فكرة، نصيحة، أو سؤال مع مجتمع المزارعين.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="idea-title">عنوان الموضوع</Label>
                    <Input
                      id="idea-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: أفضل طريقة لتسميد الطماطم"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea-description">الوصف (اختياري)</Label>
                    <Textarea
                      id="idea-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="اشرح فكرتك بتفصيل أكبر..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea-file">صورة أو فيديو (اختياري)</Label>
                    <Input
                      id="idea-file"
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,video/*"
                    />
                  </div>
                  {preview && (
                    <div className="relative">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 z-10"
                        onClick={clearFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {file?.type.startsWith('image/') ? (
                        <Image
                          src={preview}
                          alt="Preview"
                          width={400}
                          height={225}
                          className="rounded-md object-cover w-full aspect-video"
                        />
                      ) : (
                        <video src={preview} controls className="rounded-md w-full" />
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                  </DialogClose>
                  <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    {isSaving ? 'جاري النشر...' : 'نشر الموضوع'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
