'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Loader2,
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Leaf,
  Lightbulb,
  FileImage,
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
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

type Article = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageHint?: string;
  createdAt: Timestamp;
  authorId?: string;
  authorName?: string;
};

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
    query(collection(db, 'articles'), orderBy('createdAt', 'desc'))
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Dialog State
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article> | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // User Idea Dialog State
  const [isIdeaDialogOpen, setIsIdeaDialogOpen] = useState(false);
  const [isSavingIdea, setIsSavingIdea] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [ideaFile, setIdeaFile] = useState<File | null>(null);
  const [ideaFilePreview, setIdeaFilePreview] = useState<string | null>(null);


  const articles =
    articlesSnapshot?.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Article)
    ) || [];

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
          createdAt: serverTimestamp(),
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
  
  // --- User Idea Functions ---
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdeaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdeaFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetIdeaForm = () => {
    setIdeaTitle('');
    setIdeaDescription('');
    setIdeaFile(null);
    setIdeaFilePreview(null);
  };
  
 const handleSaveIdea = async () => {
    if (!ideaTitle.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء كتابة عنوان للموضوع قبل الإرسال.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user || !user.uid) {
         toast({
            title: 'خطأ',
            description: 'يجب أن تكون مسجلاً للدخول لنشر موضوع.',
            variant: 'destructive',
        });
        return;
    }

    setIsSavingIdea(true);

    try {
      let imageUrl;
      
      const articleData: any = {
        title: ideaTitle,
        description: ideaDescription || '',
        createdAt: serverTimestamp(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        imageHint: 'user generated',
      };
      
      if (ideaFile) {
        const storageRef = ref(
          storage,
          `userArticles/${user.uid}/${Date.now()}_${ideaFile.name}`
        );
        const uploadResult = await uploadBytes(storageRef, ideaFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
        articleData.imageUrl = imageUrl;
      }

      await addDoc(collection(db, 'articles'), articleData);

      toast({
        title: 'تم النشر بنجاح!',
        description: 'شكرًا لمشاركتك. لقد تم نشر موضوعك في الصفحة الرئيسية.',
        className: 'bg-green-600 text-white',
      });
      
      setIsIdeaDialogOpen(false);
      resetIdeaForm();

    } catch (e: any) {
      console.error('Error saving article:', e);
      toast({
        title: 'حدث خطأ أثناء النشر',
        description: e.message || 'لم نتمكن من حفظ موضوعك. الرجاء المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingIdea(false);
    }
  };


  if (loading || adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">جاري تحميل البيانات...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Newspaper className="h-16 w-16 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-destructive">
          حدث خطأ أثناء تحميل الأخبار
        </h2>
        <p className="mt-2 text-muted-foreground">
          الرجاء المحاولة مرة أخرى لاحقًا.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
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

      {/* Articles Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">المواضيع الزراعية</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsIdeaDialogOpen(true)}>
                <Lightbulb className="h-4 w-4 ml-2" />
                شارك بفكرتك
            </Button>
            {isAdmin && (
              <Button onClick={() => openAdminDialog()} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 ml-2" />
                إضافة موضوع
              </Button>
            )}
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-white/10 shadow-lg hover:shadow-green-500/10 transition-all duration-300"
              >
                {isAdmin && (
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
                    alt={article.title}
                    width={400}
                    height={200}
                    className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={article.imageHint}
                  />
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
                سيتم عرض مربعات المواضيع مع الصور والفيديوهات والمحتوى هنا عند إضافتها.
            </p>
            {isAdmin && (
                <Button onClick={() => openAdminDialog()} className="mt-6 bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="h-4 w-4 ml-2" />
                    أضف أول موضوع
                </Button>
            )}
          </div>
        )}
      </section>

      {/* Add/Edit Article Dialog (Admin) */}
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
      
      {/* Delete Confirmation Dialog (Admin) */}
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
      
      {/* Share Idea Dialog (User) */}
      <Dialog open={isIdeaDialogOpen} onOpenChange={setIsIdeaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>شارك بموضوع جديد</DialogTitle>
            <DialogDescription>
              اكتب تفاصيل موضوعك وأرفق صورة أو فيديو إن أردت. سيتم نشره في الصفحة الرئيسية.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="idea-title">عنوان الموضوع</Label>
              <Input
                id="idea-title"
                placeholder="مثال: أفضل طريقة لزراعة الطماطم"
                value={ideaTitle}
                onChange={(e) => setIdeaTitle(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="idea-description">وصف الموضوع</Label>
              <Textarea
                id="idea-description"
                placeholder="اكتب هنا شرحًا مبسطًا عن موضوعك..."
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                rows={4}
              />
            </div>
            
             <div className="space-y-2">
                <Label>إرفاق صورة أو فيديو (اختياري)</Label>
                {ideaFilePreview ? (
                <div className="relative group">
                    {ideaFile?.type.startsWith('image/') ? (
                    <Image src={ideaFilePreview} alt="Preview" width={400} height={200} className="rounded-md object-cover w-full h-40" />
                    ) : (
                    <video src={ideaFilePreview} controls className="rounded-md w-full h-40" />
                    )}
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                            setIdeaFile(null);
                            setIdeaFilePreview(null);
                             if(fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }}
                    >
                    <X className="h-4 w-4" />
                    </Button>
                </div>
                ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                    <FileImage className="h-4 w-4 ml-2" />
                    اختر صورة أو فيديو
                </Button>
                )}
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
             </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleSaveIdea} disabled={isSavingIdea} className="bg-green-600 hover:bg-green-700">
              {isSavingIdea ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
              {isSavingIdea ? 'جاري النشر...' : 'نشر الموضوع'}
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
      <Toaster />
      <main className="px-4 pt-4 container mx-auto">
        <HomeView isAdmin={isAdmin} adminLoading={adminLoading} user={user} />
      </main>
      <AppFooter activeView="home" />
    </div>
  );
}
