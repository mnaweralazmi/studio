'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Loader2,
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Leaf,
  FileImage,
  Video,
  X,
  Bell,
  AlertCircle,
  Send,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  collection,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  where,
  limit,
  writeBatch,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

const DUMMY_ARTICLES: Partial<Article>[] = [
    {
        id: '1',
        title: 'زراعة الطماطم في الصيف',
        description: 'دليل شامل لزراعة الطماطم في الظروف الحارة والجافة لضمان أفضل محصول.',
        imageUrl: 'https://picsum.photos/seed/tomato-summer/400/200',
        imageHint: 'tomato plant',
        authorName: 'خبير زراعي',
    },
    {
        id: '2',
        title: 'نصائح للعناية بأشجار النخيل',
        description: 'تعلم كيفية تسميد وسقي أشجار النخيل لحمايتها من الآفات وزيادة إنتاجها.',
        imageUrl: 'https://picsum.photos/seed/palm-trees/400/200',
        imageHint: 'palm trees',
        authorName: 'م. عبدالله',
    },
    {
        id: '3',
        title: 'استخدام البيوت المحمية',
        description: 'فوائد استخدام البيوت المحمية لزراعة المحاصيل خارج موسمها الطبيعي.',
        imageUrl: 'https://picsum.photos/seed/greenhouse/400/200',
        imageHint: 'greenhouse farming',
        authorName: 'فريق الإرشاد',
    },
     {
        id: '4',
        title: 'طرق مكافحة الآفات الطبيعية',
        description: 'استراتيجيات صديقة للبيئة لمكافحة الحشرات والآفات دون استخدام مواد كيميائية ضارة.',
        imageUrl: 'https://picsum.photos/seed/pest-control/400/200',
        imageHint: 'natural pest control',
        authorName: 'مزارع واعي',
    }
]

function AddIdeaDialog({ user }: { user: any }) {
  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);
  const [isSavingIdea, setIsSavingIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [ideaFile, setIdeaFile] = useState<File | null>(null);
  const [ideaFilePreview, setIdeaFilePreview] = useState<string | null>(null);
  const ideaFileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setIdeaFile(null);
    setIdeaFilePreview(null);
    if (ideaFileInputRef.current) {
      ideaFileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearFile();
      return;
    }

    if (file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast({
          variant: 'destructive',
          title: 'حجم الصورة كبير جدًا',
          description: 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت.',
        });
        clearFile();
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setIdeaFilePreview(reader.result as string);
      reader.readAsDataURL(file);
      setIdeaFile(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 60) { // 60 seconds limit for videos
          toast({
            variant: 'destructive',
            title: 'مدة الفيديو طويلة جدًا',
            description: 'يجب أن تكون مدة الفيديو أقل من 60 ثانية.',
          });
          clearFile();
        } else {
          setIdeaFile(file);
          setIdeaFilePreview(URL.createObjectURL(file));
        }
      };
      video.onerror = () => {
        toast({ variant: 'destructive', title: 'ملف فيديو غير صالح', description: 'لا يمكن قراءة مدة الفيديو.'});
        clearFile();
      }
      video.src = URL.createObjectURL(file);
    } else {
      toast({
        variant: 'destructive',
        title: 'نوع الملف غير مدعوم',
        description: 'يرجى اختيار صورة أو ملف فيديو.',
      });
      clearFile();
    }
  };

  const handleSaveIdea = async () => {
    if (!ideaTitle) {
      toast({
        variant: 'destructive',
        title: 'العنوان مطلوب',
        description: 'الرجاء إدخال عنوان للموضوع.',
      });
      return;
    }
    if (!user || !user.uid) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يجب أن تكون مسجلاً للدخول لنشر موضوع.',
      });
      return;
    }

    setIsSavingIdea(true);
    let fileUrl = '';
    let fileType: 'image' | 'video' | undefined = undefined;

    try {
      if (ideaFile) {
        fileType = ideaFile.type.startsWith('image/') ? 'image' : 'video';
        const filePath = `articles/${user.uid}/${Date.now()}_${ideaFile.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, ideaFile);
        fileUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, 'articles'), {
        title: ideaTitle,
        description: ideaDescription,
        imageUrl: fileType === 'image' ? fileUrl : '',
        videoUrl: fileType === 'video' ? fileUrl : '',
        fileType: fileType,
        authorId: user.uid,
        authorName: user.displayName || 'مستخدم غير معروف',
        createdAt: new Date(),
      });

      toast({
        title: 'تم النشر بنجاح!',
        description: 'شكراً لمشاركتك. سيظهر موضوعك في القائمة.',
        className: 'bg-green-600 text-white',
      });
      setIdeaTitle('');
      setIdeaDescription('');
      clearFile();
      setIsIdeaDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving idea:', error);
      if (error.code === 'storage/unauthorized') {
        toast({
          variant: 'destructive',
          title: 'خطأ في الصلاحيات',
          description:
            'لا توجد صلاحيات كافية لرفع الملفات. يرجى مراجعة قواعد الأمان في Firebase Storage.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ في النشر',
          description:
            'لم نتمكن من حفظ موضوعك. يرجى المحاولة مرة أخرى.',
        });
      }
    } finally {
      setIsSavingIdea(false);
    }
  };

  return (
    <Dialog open={isIdeaDialogOpen} onOpenChange={setIsIdeaDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 ml-2" />
          أضف فكرتك
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>موضوع جديد</DialogTitle>
          <DialogDescription>
            شارك فكرة أو موضوعًا جديدًا مع الآخرين.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="idea-title">العنوان</Label>
            <Input
              id="idea-title"
              placeholder="عنوان الموضوع"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idea-description">التفاصيل</Label>
            <Textarea
              id="idea-description"
              placeholder="اشرح فكرتك بالتفصيل..."
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>صورة أو فيديو (اختياري)</Label>
            {ideaFilePreview ? (
              <div className="relative">
                {ideaFile?.type.startsWith('image/') ? (
                  <Image
                    src={ideaFilePreview}
                    alt="معاينة"
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover rounded-md"
                  />
                ) : (
                  <video src={ideaFilePreview} controls className="w-full h-48 rounded-md" />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50"
                onClick={() => ideaFileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  اختر صورة أو فيديو
                </p>
                <p className="text-xs text-muted-foreground">
                  الحد الأقصى: 5MB للصور، 60 ثانية للفيديو
                </p>
                <Input
                  type="file"
                  ref={ideaFileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button onClick={handleSaveIdea} disabled={isSavingIdea}>
            {isSavingIdea ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Send className="h-4 w-4 ml-2" />
            )}
            {isSavingIdea ? 'جاري النشر...' : 'نشر الموضوع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotificationsPopover({ user }: {user: any}) {
  const notificationsQuery = user
    ? query(
        collection(db, 'notifications'),
        where('target', 'in', ['all', user.uid]),
        limit(10)
      )
    : null;
  const [snapshot, loading] = useCollection(notificationsQuery);
  const [shownNotifications, setShownNotifications] = useState(new Set());

  const notifications = useMemo(() =>{
    const data = snapshot?.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notification)
      ) || [];
    return data.sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
  }, [snapshot]);
  
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const unreadAndUnshown = notifications.filter(n => !n.read && !shownNotifications.has(n.id));
     if (unreadAndUnshown.length > 0) {
        const latestNotification = unreadAndUnshown[0];
         if (latestNotification) {
            toast({
              title: latestNotification.title,
              description: latestNotification.body,
            });
            setShownNotifications(prev => new Set(prev).add(latestNotification.id));
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);


  const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications]);

  const handleOpen = async (open: boolean) => {
    if (open && hasUnread && snapshot) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        if (!d.data().read) {
          batch.update(d.ref, { read: true });
        }
      });
      await batch.commit();
    }
  };
  

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />}
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
                <div key={n.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0">
                  <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!n.read ? 'bg-sky-500' : 'bg-muted'}`} />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {n.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                     <p className="text-xs text-muted-foreground mt-1">
                        {n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: ar }) : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">لا توجد إشعارات جديدة.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HomeView({
  isAdmin,
  adminLoading,
  user,
}: {
  isAdmin: boolean;
  adminLoading: boolean;
  user: any;
}) {
  const [articlesSnapshot, loading, error] = useCollection(
    collection(db, 'articles')
  );
  
  // Admin Dialog State
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article> | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const articles = useMemo(() => {
    const data =
      articlesSnapshot?.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Article)
      ) || [];
    return data.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [articlesSnapshot]);

  // --- Admin Functions ---
  const openAdminDialog = (article: Partial<Article> | null = null) => {
    setCurrentArticle(article ? { ...article } : {});
    setIsArticleDialogOpen(true);
  };
  
  const openDeleteConfirmation = (id: string) => {
    setArticleToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleSaveArticle = async () => {
    if (!currentArticle || !currentArticle.title || !currentArticle.description)
      return;
    setIsSavingArticle(true);

    try {
      if (currentArticle.id) {
        const articleRef = doc(db, 'articles', currentArticle.id);
        await updateDoc(articleRef, {
          title: currentArticle.title,
          description: currentArticle.description,
          imageUrl: currentArticle.imageUrl,
          imageHint: currentArticle.imageHint,
        });
      } else {
        await addDoc(collection(db, 'articles'), {
          ...currentArticle,
          authorId: user.uid,
          authorName: user.displayName || 'Admin',
          createdAt: new Date(),
        });
      }
      setIsArticleDialogOpen(false);
      setCurrentArticle(null);
    } catch (e) {
      console.error('Error saving article:', e);
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    await deleteDoc(doc(db, 'articles', articleToDelete));
    setShowDeleteConfirm(false);
    setArticleToDelete(null);
  };
  
  const displayArticles = error ? (DUMMY_ARTICLES as Article[]) : articles;

  if (adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">جاري تحميل البيانات...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="text-center space-y-4 pt-8">
        <div className="flex justify-center">
            <Badge variant="outline" className="border-green-500/50 bg-green-900/20 text-green-400 text-sm py-1 px-4">
                <Leaf className="h-4 w-4 ml-2" />
                مزارع كويتي
            </Badge>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground">
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
            {isAdmin && (
              <Button onClick={() => openAdminDialog()} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 ml-2" />
                إضافة موضوع
              </Button>
            )}
            <NotificationsPopover user={user} />
          </div>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-white/10">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <h2 className="mt-4 text-xl font-semibold">جاري تحميل المواضيع...</h2>
            </div>
        ) : (displayArticles.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayArticles.map((article) => (
              <Card
                key={article.id}
                className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-white/10 shadow-lg hover:shadow-green-500/10 transition-all duration-300"
              >
                {isAdmin && !error && (
                  <div className="absolute top-2 left-2 z-10 flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-card/70 backdrop-blur-sm" onClick={() => openAdminDialog(article)}>
                      <Pencil className="h-4 w-4"/>
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => openDeleteConfirmation(article.id)}>
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                )}
                {article.imageUrl ? (
                  <Image
                    src={
                      article.imageUrl
                    }
                    alt={article.title || 'Article Image'}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={article.imageHint}
                  />
                ) : article.videoUrl ? (
                    <video src={article.videoUrl} controls className="w-full h-40 object-cover" />
                ) : (
                   <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <Newspaper className="h-10 w-10 text-muted-foreground" />
                   </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                   {article.authorName && (
                    <p className="text-xs text-muted-foreground">بواسطة: {article.authorName}</p>
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
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-white/10">
            <Newspaper className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">
              لا توجد مواضيع لعرضها حاليًا
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
                كن أول من يشارك فكرة أو موضوعًا جديدًا!
            </p>
          </div>
        )}
      </section>

      <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentArticle?.id ? 'تعديل الموضوع' : 'إضافة موضوع جديد'}
            </DialogTitle>
            <DialogDescription>
              املأ التفاصيل أدناه. سيظهر هذا الموضوع في الصفحة الرئيسية.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={currentArticle?.title || ''}
                onChange={(e) =>
                  setCurrentArticle({ ...currentArticle, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={currentArticle?.description || ''}
                onChange={(e) =>
                  setCurrentArticle({
                    ...currentArticle,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">رابط الصورة</Label>
              <Input
                id="imageUrl"
                placeholder="https://picsum.photos/seed/..."
                value={currentArticle?.imageUrl || ''}
                onChange={(e) =>
                  setCurrentArticle({
                    ...currentArticle,
                    imageUrl: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageHint">
                كلمات دلالية للصورة (للبحث المستقبلي)
              </Label>
              <Input
                id="imageHint"
                placeholder="مثال: farm tomato"
                value={currentArticle?.imageHint || ''}
                onChange={(e) =>
                  setCurrentArticle({
                    ...currentArticle,
                    imageHint: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleSaveArticle} disabled={isSavingArticle}>
              {isSavingArticle ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              {isSavingArticle ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المقال بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
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

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <Toaster />
      <main className="px-4 pt-4 container mx-auto">
        <HomeView isAdmin={isAdmin} adminLoading={adminLoading} user={user} />
      </main>
      <AppFooter activeView="home" />
    </div>
  );
}
