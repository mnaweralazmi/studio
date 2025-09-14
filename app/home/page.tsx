'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Loader2,
  Newspaper,
  Trash2,
  Bell,
  AlertCircle,
  Leaf,
  Plus,
  Image as ImageIcon,
  Video,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  Timestamp,
  where,
  limit,
  writeBatch,
  addDoc,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAdmin } from '@/lib/hooks/useAdmin';
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
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Article = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  fileType?: 'image' | 'video';
  imageHint?: string;
  createdAt: Timestamp;
  authorId?: string;
  authorName?: string;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp;
  read: boolean;
};

function AddIdeaDialog({ user }: { user: any }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(undefined);
    setPreview(undefined);
    const fileInput = document.getElementById('idea-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    clearFile();
  }, []);

  const handleSave = async () => {
    if (!title || !user) {
      return;
    }
    setIsSaving(true);
    try {
      const articleData: DocumentData = {
        title,
        description,
        authorId: user.uid,
        authorName: user.displayName || 'مستخدم غير معروف',
        createdAt: new Date(),
      };

      if (file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        const filePath = `articles/${user.uid}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        if (fileType === 'image') {
          articleData.imageUrl = fileUrl;
        } else {
          articleData.videoUrl = fileUrl;
        }
        articleData.fileType = fileType;
      }

      await addDoc(collection(db, 'articles'), articleData);

      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });

      clearForm();
      setOpen(false);
    } catch (e) {
      console.error('Error saving idea: ', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
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
                  height={200}
                  className="rounded-md object-cover"
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
          <Button onClick={handleSave} disabled={isSaving || !title}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isSaving ? 'جاري النشر...' : 'اربطه مع قاعدة البيانات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotificationsPopover({ user }: { user: any }) {
  const { toast } = useToast();
  const notificationsQuery = useMemo(
    () =>
      user
        ? query(
            collection(db, 'notifications'),
            where('target', 'in', ['all', user.uid]),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        : null,
    [user]
  );

  const [snapshot, loading] = useCollection(notificationsQuery);
  const [shownNotifications, setShownNotifications] = useState(new Set());

  const notifications = useMemo(() => {
    return (
      snapshot?.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notification)
      ) || []
    );
  }, [snapshot]);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const unreadAndUnshown = notifications.find(
      (n) => !n.read && !shownNotifications.has(n.id)
    );

    if (unreadAndUnshown) {
      toast({
        title: unreadAndUnshown.title,
        description: unreadAndUnshown.body,
      });
      setShownNotifications((prev) => new Set(prev).add(unreadAndUnshown.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, toast]);

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
    [notifications]
  );

  const handleOpen = async (open: boolean) => {
    if (open && hasUnread && snapshot) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        if (!d.data().read) {
          batch.update(d.ref, { read: true });
        }
      });
      try {
        await batch.commit();
      } catch (error) {
        console.error('Error marking notifications as read: ', error);
      }
    }
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">الإشعارات</h4>
            <p className="text-sm text-muted-foreground">
              آخر الإشعارات والتحديثات.
            </p>
          </div>
          <div className="grid gap-2">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0"
                >
                  <span
                    className={`flex h-2 w-2 translate-y-1 rounded-full ${
                      !n.read ? 'bg-sky-500' : 'bg-muted'
                    }`}
                  />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.createdAt
                        ? formatDistanceToNow(n.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ar,
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">
                لا توجد إشعارات جديدة.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HomeView({ isAdmin, user }: { isAdmin: boolean; user: any }) {
  const { toast } = useToast();
  const articlesCollection = collection(db, 'articles');
  const [articlesSnapshot, loading, error] = useCollection(
    query(articlesCollection, orderBy('createdAt', 'desc'))
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const articles = useMemo(
    () =>
      articlesSnapshot?.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Article)
      ) || [],
    [articlesSnapshot]
  );

  const openDeleteConfirmation = (id: string) => {
    setArticleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      await deleteDoc(doc(articlesCollection, articleToDelete));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الموضوع بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (e) {
      console.error('Error deleting article: ', e);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحذف',
        description: 'لم نتمكن من حذف الموضوع.',
      });
    } finally {
      setShowDeleteConfirm(false);
      setArticleToDelete(null);
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
            <AddIdeaDialog user={user} />
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

        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-border">
            <Newspaper className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">
              هل المواضيع تعرض هنا
            </h2>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
              >
                {isAdmin && !error && (
                  <div className="absolute top-2 left-2 z-10 flex gap-2">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openDeleteConfirmation(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.title || 'Article Image'}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={article.imageHint}
                  />
                ) : article.videoUrl ? (
                  <video
                    src={article.videoUrl}
                    controls
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <Newspaper className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  {article.authorName && (
                    <p className="text-xs text-muted-foreground">
                      بواسطة: {article.authorName}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {article.description}
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
              هل أنت متأكد من رغبتك في حذف هذا المقال بشكل نهائي؟ لا يمكن
              التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteArticle}>
              نعم، قم بالحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || adminLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <main className="px-4 pt-4 container mx-auto">
        <HomeView isAdmin={isAdmin} user={user} />
      </main>
      <AppFooter activeView="home" />
      <Toaster />
    </div>
  );
}
