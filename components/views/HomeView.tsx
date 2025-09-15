// --- FILE: components/views/HomeView.tsx ---
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
  updateDoc,
  collectionGroup,
  where,
  serverTimestamp,
  getDocs,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { db, storage, auth } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import type { User } from 'firebase/auth';

import { Loader2, Newspaper, Trash2, Leaf, Plus, X, Lock, Globe } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

type Topic = {
  id: string;
  path: string; // المسار الكامل للمستند
  title: string;
  description: string;
  imageUrl?: string;
  isPublic: boolean;
  createdAt: Timestamp;
  userId: string;
  authorName?: string;
};

// --- دالة إنشاء الموضوع مع رفع الملف ---
async function createTopicWithFile(
  title: string,
  description: string,
  file: File | undefined,
  isPublic: boolean
): Promise<{ topicId: string; imageUrl?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('يجب تسجيل الدخول لإنشاء موضوع.');
  }

  let topicRef;
  const userTopicsCollection = collection(db, 'users', currentUser.uid, 'topics');

  try {
    // 1. إنشاء مستند الموضوع أولاً بدون رابط الصورة للحصول على ID فريد
    topicRef = await addDoc(userTopicsCollection, {
      title: title.trim(),
      description: description.trim(),
      userId: currentUser.uid,
      authorName: currentUser.displayName || 'مستخدم غير معروف',
      isPublic: isPublic,
      createdAt: serverTimestamp(),
      imageUrl: null, // سيتم التحديث لاحقًا
    });

    let imageUrl: string | undefined = undefined;

    // 2. إذا كان هناك ملف، قم برفعه باستخدام ID المستند الجديد
    if (file) {
      // بناء مسار آمن ومتوافق مع storage.rules
      const filePath = `users/${currentUser.uid}/topics/${topicRef.id}/${file.name}`;
      const fileRef = ref(storage, filePath);
      
      // رفع الملف
      await uploadBytes(fileRef, file);
      imageUrl = await getDownloadURL(fileRef);

      // 3. تحديث المستند الأصلي برابط الصورة بعد نجاح الرفع
      await updateDoc(topicRef, { imageUrl: imageUrl });
    }

    return { topicId: topicRef.id, imageUrl }; // إرجاع المعرف والرابط
  } catch (error) {
    // تنظيف: إذا فشلت العملية بعد إنشاء المستند، قم بحذفه لمنع البيانات المعلقة
    if (topicRef) {
      await deleteDoc(doc(userTopicsCollection, topicRef.id));
    }
    // إرجاع الخطأ ليتم التعامل معه في الواجهة
    throw error;
  }
}


export default function HomeView({ user }: { user: User }) {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  // --- State لعرض المواضيع والأخطاء ---
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  // --- State لنموذج إضافة موضوع ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Hook لجلب المواضيع العامة باستخدام collectionGroup ---
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // الاستعلام عن المواضيع العامة
    const publicQuery = query(
      collectionGroup(db, 'topics'), 
      where('isPublic', '==', true), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    // الاستعلام عن مواضيع المستخدم الخاصة
    const userQuery = query(
      collection(db, 'users', user.uid, 'topics'),
      where('isPublic', '==', false),
      orderBy('createdAt', 'desc')
    );

    const processSnapshots = (publicTopics: Topic[], userTopics: Topic[]) => {
       // دمج النتائج وإزالة التكرار (قد يكون موضوع المستخدم عامًا أيضًا)
       const allTopicsMap = new Map<string, Topic>();
       
       publicTopics.forEach(topic => allTopicsMap.set(topic.id, topic));
       userTopics.forEach(topic => allTopicsMap.set(topic.id, topic));

       const combinedTopics = Array.from(allTopicsMap.values());
       
       // فرز كل المواضيع حسب تاريخ الإنشاء
       combinedTopics.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

       setTopics(combinedTopics);
       setError(null);
       setLoading(false);
    }
    
    let publicTopics: Topic[] = [];
    let userTopics: Topic[] = [];

    const unsubscribePublic = onSnapshot(publicQuery, (snapshot) => {
      publicTopics = snapshot.docs.map(doc => ({
        id: doc.id,
        path: doc.ref.path,
        ...doc.data()
      } as Topic));
      processSnapshots(publicTopics, userTopics);
    }, (err) => {
      console.error("Public topics listener error:", err);
      if (err.code === 'permission-denied') {
        setError('خطأ في الأذونات: ليس لديك الصلاحية لقراءة هذه البيانات. تأكد من صحة قواعد الأمان في Firestore.');
      } else if (err.code === 'failed-precondition') {
        setError('خطأ: هذا الاستعلام يتطلب فهرسًا مركبًا. يرجى إنشاء الفهرس المطلوب في لوحة تحكم Firebase.');
      } else {
        setError('حدث خطأ أثناء جلب المواضيع العامة.');
      }
      setLoading(false);
    });

    const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
        userTopics = snapshot.docs.map(doc => ({
            id: doc.id,
            path: doc.ref.path,
            ...doc.data()
        } as Topic));
        processSnapshots(publicTopics, userTopics);
    }, (err) => {
        console.error("User topics listener error:", err);
        setError('حدث خطأ أثناء جلب مواضيعك الخاصة.');
        setLoading(false);
    });
    
    return () => {
        unsubscribePublic();
        unsubscribeUser();
    };
  }, [user]);


  const openDeleteConfirmation = (topic: Topic) => {
    setTopicToDelete(topic);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await deleteDoc(doc(db, topicToDelete.path));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الموضوع بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في الحذف',
        description: e.message || 'لم نتمكن من حذف الموضوع.',
      });
    } finally {
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    }
  };

  const canDelete = (topic: Topic) => {
    return isAdmin || topic.userId === user.uid;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preview) URL.revokeObjectURL(preview);
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
    if (preview) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview(undefined);
    const fileInput = document.getElementById('idea-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [preview]);

  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    clearFile();
  }, [clearFile]);
  
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'عنوان الموضوع مطلوب.' });
      return;
    }
    setIsSaving(true);
    
    try {
      await createTopicWithFile(title, description, file, isPublic);
      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });
      clearForm();
      setDialogOpen(false);
    } catch (e: any) {
      console.error('Error saving topic: ', e);
      let description = 'لم نتمكن من نشر موضوعك. يرجى المحاولة مرة أخرى.';
      if (e.code === 'storage/unauthorized' || e.code === 'permission-denied') {
        description = 'ليس لديك الصلاحية لرفع الملفات أو إنشاء الموضوع. تحقق من قواعد الأمان.';
      }
      toast({ variant: 'destructive', title: 'خطأ في النشر', description });
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
              onOpenChange={(isOpen) => { setDialogOpen(isOpen); if (!isOpen) clearForm(); }}
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
                  <DialogDescription>شارك فكرة، نصيحة، أو سؤال مع مجتمع المزارعين.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="idea-title">عنوان الموضوع</Label>
                    <Input id="idea-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: أفضل طريقة لتسميد الطماطم" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea-description">الوصف (اختياري)</Label>
                    <Textarea id="idea-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اشرح فكرتك بتفصيل أكبر..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idea-file">صورة أو فيديو (اختياري)</Label>
                    <Input id="idea-file" type="file" onChange={handleFileChange} accept="image/*,video/*" />
                  </div>
                  {preview && (
                    <div className="relative">
                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={clearFile}><X className="h-4 w-4" /></Button>
                      {file?.type.startsWith('image/') ? (
                        <Image src={preview} alt="Preview" width={400} height={225} className="rounded-md object-cover w-full aspect-video" />
                      ) : (
                        <video src={preview} controls className="rounded-md w-full" />
                      )}
                    </div>
                  )}
                   <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                    <Label htmlFor="is-public" className="cursor-pointer">
                      {isPublic ? 'موضوع عام (يظهر للجميع)' : 'موضوع خاص (يظهر لك فقط)'}
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                  <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
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
            <h2 className="mt-4 text-xl font-semibold">جاري تحميل المواضيع...</h2>
          </div>
        )}

        {error && (
            <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>حدث خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 bg-card/30 rounded-lg border-2 border-dashed border-border">
            <Newspaper className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">لا توجد مواضيع لعرضها حاليًا</h2>
            <p className="text-muted-foreground mt-2">كن أول من يشارك فكرة أو موضوعًا جديدًا!</p>
          </div>
        )}

        {!loading && !error && topics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-2 right-2 z-10">
                   {topic.isPublic ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><Globe className="h-3 w-3 ml-1" />عام</Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"><Lock className="h-3 w-3 ml-1" />خاص</Badge>
                    )}
                </div>
                {canDelete(topic) && (
                  <div className="absolute top-2 left-2 z-10 flex gap-2">
                    <Button variant="destructive" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openDeleteConfirmation(topic)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {topic.imageUrl ? (
                  <Image src={topic.imageUrl} alt={topic.title || 'Topic Image'} width={400} height={200} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <Newspaper className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  {topic.authorName && (<p className="text-xs text-muted-foreground">بواسطة: {topic.authorName}</p>)}
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-2">{topic.description}</p>
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
            <DialogDescription>هل أنت متأكد من رغبتك في حذف هذا الموضوع بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteTopic}>نعم، قم بالحذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
