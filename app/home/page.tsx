'use client';

import AppFooter from '@/components/AppFooter';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Loader2,
  ShieldAlert,
  Plus,
  Leaf,
  Bell,
  X,
  Save,
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import HomeView from '@/components/views/HomeView';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import AdMarquee from '@/components/home/AdMarquee';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import NotificationsPopover from '@/components/home/NotificationsPopover';
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
import Image from 'next/image';

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
    createdAt: serverTimestamp(),
    imageUrl: '',
    imagePath: '',
    archived: false, // Ensure this field is set by default
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

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [isAddTopicOpen, setAddTopicOpen] = useState(false);

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const topicsCollectionRef = collection(db, 'publicTopics');
      const q = query(
        topicsCollectionRef,
        where('archived', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const allTopics = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        path: doc.ref.path,
        ...doc.data(),
      })) as Topic[];
      
      // Also fetch topics that don't have the `archived` field yet
      const legacyQuery = query(topicsCollectionRef, orderBy('createdAt', 'desc'));
      const legacySnapshot = await getDocs(legacyQuery);
      const legacyTopics = legacySnapshot.docs
        .map(doc => ({ id: doc.id, path: doc.ref.path, ...doc.data() } as Topic))
        .filter(topic => topic.archived === undefined);
        
      // Combine and remove duplicates
      const combined = [...allTopics, ...legacyTopics];
      const uniqueTopics = Array.from(new Set(combined.map(t => t.id)))
        .map(id => combined.find(t => t.id === id)!)
        .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));


      setTopics(uniqueTopics);
    } catch (e: any) {
      console.error('Error fetching topics:', e);
      if (e.code === 'failed-precondition') {
        setTopicsError(
          'حدث خطأ في قاعدة البيانات. قد يتطلب هذا الاستعلام فهرسًا مخصصًا. يرجى مراجعة سجلات Firestore.'
        );
      } else {
        setTopicsError(
          'حدث خطأ أثناء جلب المواضيع. قد تكون مشكلة في الاتصال أو صلاحيات الوصول.'
        );
      }
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  if (loading || !user || adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <main className="px-4 pt-4 container mx-auto">
        <header className="pt-8 mb-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  واحة المزرعة
                </h1>
                <p className="mt-1 text-md text-muted-foreground">
                  مكان واحد لمشاركة الأفكار وإدارة النقاشات.
                </p>
              </div>
            </div>
            {/* The button is available for all logged-in users now */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setAddTopicOpen(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                <span>إضافة موضوع</span>
              </Button>
              {user && <NotificationsPopover user={user} />}
            </div>
          </div>
        </header>

        <AdMarquee />

        <HomeView
          user={user}
          topics={topics}
          loading={topicsLoading}
          error={topicsError}
          onRefresh={fetchTopics}
        />
      </main>
      <AppFooter activeView="home" />
      <Toaster />
      <AddTopicDialog
        isOpen={isAddTopicOpen}
        setIsOpen={setAddTopicOpen}
        onTopicAdded={fetchTopics}
      />
    </div>
  );
}
