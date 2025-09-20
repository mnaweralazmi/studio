'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  Loader2,
  Plus,
  X,
  Save,
  Home,
  AlertCircle,
} from 'lucide-react';

import { Toaster } from '@/components/ui/toaster';
import IdeasView, { Topic } from '@/components/views/HomeView';
import {
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  where,
  orderBy,
  query,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/ui/use-toast';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useFirestoreQuery } from '@/lib/hooks/useFirestoreQuery';


type TopicFormData = {
  title: string;
  description: string;
  file?: File;
};


async function createTopic(data: TopicFormData): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('يجب تسجيل الدخول لإنشاء موضوع.');

  const topicCollection = collection(db, 'publicTopics');
  const topicRef = doc(topicCollection);

  const newTopic: any = {
    title: data.title.trim(),
    description: data.description.trim(),
    userId: currentUser.uid,
    authorName: currentUser.displayName || 'مستخدم غير معروف',
    authorPhotoURL: currentUser.photoURL || '',
    createdAt: serverTimestamp(),
    imageUrl: '',
    imagePath: '',
    archived: false,
    likes: 0,
    comments: 0,
  };

  if (data.file) {
    const imagePath = `publicTopics/${topicRef.id}/${data.file.name}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, data.file);
    newTopic.imageUrl = await getDownloadURL(imageRef);
    newTopic.imagePath = imagePath;
  }

  await setDoc(topicRef, newTopic);
}

function AddTopicDialog({
  isOpen,
  setIsOpen,
  onTopicAdded,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onTopicAdded: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setFile(undefined);
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(undefined);
  }, [preview]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(clearForm, 300);
    }
  }, [isOpen, clearForm]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preview && preview.startsWith('blob:')) {
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

  const clearFile = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview(undefined);
    const fileInput = document.getElementById('topic-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'عنوان الموضوع مطلوب.',
      });
      return;
    }
    setIsSaving(true);
    try {
      await createTopic({ title, description, file });
      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });
      setIsOpen(false);
      onTopicAdded();
    } catch (e: any) {
      console.error('Error saving topic: ', e);
      toast({
        variant: 'destructive',
        title: 'خطأ في النشر',
        description: e.message || 'لم نتمكن من نشر موضوعك.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isVideo = useMemo(() => {
    if (file) return file.type.startsWith('video/');
    return false;
  }, [file]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>أضف فكرة أو موضوع جديد</DialogTitle>
          <DialogDescription>
            شارك فكرة، نصيحة، أو سؤال مع مجتمع المزارعين.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="topic-title">عنوان الموضوع</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: أفضل طريقة لتسميد الطماطم"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-description">الوصف (اختياري)</Label>
            <Textarea
              id="topic-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح فكرتك بتفصيل أكبر..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-file">صورة أو فيديو (اختياري)</Label>
            <Input
              id="topic-file"
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
              {isVideo ? (
                <video src={preview} controls className="rounded-md w-full" />
              ) : (
                <Image
                  src={preview}
                  alt="Preview"
                  width={400}
                  height={225}
                  className="rounded-md object-cover w-full aspect-video"
                />
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
              <Save className="h-4 w-4 ml-2" />
            )}
            {isSaving ? 'جاري النشر...' : 'نشر الموضوع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function IdeasPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAddTopicOpen, setAddTopicOpen] = useState(false);
  
  const { 
    data: topics, 
    loading: topicsLoading, 
    error: topicsError,
    refetch
  } = useFirestoreQuery<Topic>('publicTopics', 
    [
      where('archived', '==', false),
      orderBy('createdAt', 'desc')
    ], 
    'publicCollection'
  );

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
    <div className="pb-10">
      <main className="container mx-auto px-4 pt-4">
        
        <header className="flex justify-between items-center mb-6 pt-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">بنك الأفكار</h1>
              <p className="mt-1 text-muted-foreground">
                استكشف وشارك الأفكار والنقاشات مع مجتمع المزارعين.
              </p>
            </div>
             <div className="flex items-center gap-2">
                <Button onClick={() => setAddTopicOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    أضف موضوعًا
                </Button>
                <Link href="/home">
                    <Button variant="outline">
                        <Home className="h-4 w-4 ml-2" />
                        العودة للرئيسية
                    </Button>
                </Link>
            </div>
        </header>
        
        {topicsError && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 my-4 flex items-center gap-4">
              <AlertCircle className="h-8 w-8" />
              <div>
                  <h3 className="font-bold">خطأ في جلب البيانات</h3>
                  <p>خطأ في الفهرس: الاستعلام يتطلب فهرسًا مخصصًا. يرجى مراجعة console المتصفح لإنشاء الفهرس.</p>
              </div>
          </div>
        )}

        <IdeasView
          user={user}
          topics={topics || []}
          loading={topicsLoading}
          error={null}
          onRefresh={refetch}
        />
      </main>

      <Toaster />
      <AddTopicDialog
        isOpen={isAddTopicOpen}
        setIsOpen={setAddTopicOpen}
        onTopicAdded={refetch}
      />
    </div>
  );
}
