'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Newspaper, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Article = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageHint?: string;
  createdAt: Timestamp;
};

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('ar-KW');
  }
  return new Date(date).toLocaleDateString('ar-KW');
};

function HomeView({ isAdmin, adminLoading }: { isAdmin: boolean, adminLoading: boolean }) {
  const [articlesSnapshot, loading, error] = useCollection(
    query(collection(db, 'articles'), orderBy('createdAt', 'desc'))
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article> | null>(null);

  const articles =
    articlesSnapshot?.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Article)
    ) || [];

  const openDialog = (article: Partial<Article> | null = null) => {
    setCurrentArticle(article ? { ...article } : {});
    setIsDialogOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!currentArticle || !currentArticle.title || !currentArticle.description) return;
    setIsSaving(true);
    
    try {
      if (currentArticle.id) {
        // Update existing article
        const articleRef = doc(db, 'articles', currentArticle.id);
        await updateDoc(articleRef, {
            title: currentArticle.title,
            description: currentArticle.description,
            imageUrl: currentArticle.imageUrl,
            imageHint: currentArticle.imageHint,
        });
      } else {
        // Add new article
        await addDoc(collection(db, 'articles'), {
          ...currentArticle,
          createdAt: serverTimestamp()
        });
      }
      setIsDialogOpen(false);
      setCurrentArticle(null);
    } catch(e) {
        console.error("Error saving article:", e);
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteArticle = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المقال بشكل نهائي؟')) {
        await deleteDoc(doc(db, 'articles', id));
    }
  };

  if (loading || adminLoading) {
     return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">
          جاري تحميل البيانات...
        </h2>
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

  // Admin View
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
                <CardTitle>إدارة المقالات والأخبار</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">أضف، عدّل، أو احذف المقالات التي تظهر للمستخدمين.</p>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة مقال جديد
            </Button>
          </CardHeader>
          <CardContent>
            {articles.length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center py-16 bg-card rounded-lg border-2 border-dashed">
                    <Newspaper className="h-16 w-16 text-muted-foreground" />
                    <h2 className="mt-4 text-xl font-semibold">
                        لا توجد مقالات لعرضها
                    </h2>
                    <p className="mt-2 text-muted-foreground max-w-md">
                        ابدأ بإضافة أول مقال ليظهر للمستخدمين في الصفحة الرئيسية.
                    </p>
                    <Button onClick={() => openDialog()} className="mt-6">
                        <Plus className="h-4 w-4 ml-2" />
                        أضف أول مقال
                    </Button>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>العنوان</TableHead>
                            <TableHead className="hidden md:table-cell">الوصف</TableHead>
                            <TableHead className="hidden sm:table-cell">تاريخ النشر</TableHead>
                            <TableHead className="text-left">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {articles.map((article) => (
                        <TableRow key={article.id}>
                            <TableCell className="font-medium max-w-xs truncate">{article.title}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-sm truncate text-muted-foreground">{article.description}</TableCell>
                            <TableCell className="hidden sm:table-cell">{formatDate(article.createdAt)}</TableCell>
                            <TableCell className="text-left">
                            <div className="flex items-center justify-end gap-1">
                                <Button variant="outline" size="icon" onClick={() => openDialog(article)}>
                                <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteArticle(article.id)}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{currentArticle?.id ? 'تعديل المقال' : 'إضافة مقال جديد'}</DialogTitle>
                  <DialogDescription>
                      املأ التفاصيل أدناه. سيظهر هذا المقال في الصفحة الرئيسية.
                  </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="title">العنوان</Label>
                      <Input id="title" value={currentArticle?.title || ''} onChange={(e) => setCurrentArticle({...currentArticle, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea id="description" value={currentArticle?.description || ''} onChange={(e) => setCurrentArticle({...currentArticle, description: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="imageUrl">رابط الصورة</Label>
                      <Input id="imageUrl" placeholder="https://picsum.photos/seed/..." value={currentArticle?.imageUrl || ''} onChange={(e) => setCurrentArticle({...currentArticle, imageUrl: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="imageHint">كلمات دلالية للصورة (للبحث المستقبلي)</Label>
                      <Input id="imageHint" placeholder="مثال: farm tomato" value={currentArticle?.imageHint || ''} onChange={(e) => setCurrentArticle({...currentArticle, imageHint: e.target.value})} />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                  <Button onClick={handleSaveArticle} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <CheckCircle className="h-4 w-4 ml-2" />}
                      {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // User View
  return (
    <div className="space-y-6">
      <header>
          <h1 className="text-3xl font-bold text-foreground">
            أخبار ومواضيع زراعية
          </h1>
          <p className="mt-1 text-muted-foreground">
            ابق على اطلاع بآخر الأخبار والنصائح في عالم الزراعة.
          </p>
      </header>
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Image
                src={article.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                alt={article.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
                data-ai-hint={article.imageHint}
              />
              <CardHeader>
                <CardTitle>{article.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {article.description}
                </p>
                <Button variant="outline" className="w-full">
                  اقرأ المزيد
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-card rounded-lg border-2 border-dashed">
          <Newspaper className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            لا توجد مواضيع لعرضها
          </h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            سيتم عرض مربعات المواضيع مع الصور والفيديوهات والمحتوى هنا عند إضافتها.
          </p>
        </div>
      )}
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <main className="px-4 pt-4">
        <HomeView isAdmin={isAdmin} adminLoading={adminLoading} />
      </main>
      <AppFooter activeView="home" />
    </div>
  );
}
