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
  MessageCircle,
  Heart,
  TrendingUp,
  Landmark,
  Wallet,
  CalendarCheck,
  User as UserIcon,
  Settings,
} from 'lucide-react';

import { Toaster } from '@/components/ui/toaster';
import HomeView, { Topic } from '@/components/views/HomeView';
import {
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  where,
  orderBy,
  query,
  getDocs,
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
import { useFirestoreQuery } from '@/lib/hooks/useFirestoreQuery';
import AdMarquee from '@/components/home/AdMarquee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type TopicFormData = {
  title: string;
  description: string;
  file?: File;
};

// --- Quick Stats ---
const useQuickStats = (userId?: string) => {
  const [stats, setStats] = useState({
    todayTasks: 0,
    monthlyIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch Today's Tasks
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const tasksQuery = query(
          collection(db, `users/${userId}/tasks`),
          where('date', '>=', Timestamp.fromDate(startOfToday)),
          where('date', '<=', Timestamp.fromDate(endOfToday)),
          where('completed', '==', false)
        );
        const tasksSnap = await getDocs(tasksQuery);
        const todayTasks = tasksSnap.size;

        // Fetch Monthly Income
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const salesCollections = [
          'agriSales',
          'poultryEggSales',
          'poultrySales',
          'livestockSales',
        ];
        let totalIncome = 0;

        for (const coll of salesCollections) {
          const salesQuery = query(
            collection(db, `users/${userId}/${coll}`),
            where('date', '>=', Timestamp.fromDate(startOfMonth))
          );
          const salesSnap = await getDocs(salesQuery);
          salesSnap.forEach((doc) => {
            totalIncome += doc.data().totalAmount || 0;
          });
        }

        setStats({
          todayTasks,
          monthlyIncome: totalIncome,
        });
      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};

// --- Add Topic Dialog (Unchanged but kept for functionality) ---
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

// --- Main Home Page Component ---
export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isAddTopicOpen, setAddTopicOpen] = useState(false);

  const { stats: quickStats, loading: statsLoading } = useQuickStats(user?.uid);

  const {
    data: topics,
    loading: topicsLoading,
    error: topicsError,
    refetch,
  } = useFirestoreQuery<Topic>('publicTopics', [
    where('archived', '==', false),
    orderBy('createdAt', 'desc'),
  ]);

  const handleTopicAdded = () => {
    if (refetch) refetch();
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const quickAccessLinks = [
    {
      title: 'إدارة المصاريف',
      href: '/management?tab=farmManagement',
      icon: Wallet,
      color: 'bg-blue-500',
    },
    {
      title: 'عرض الميزانية',
      href: '/budget',
      icon: Landmark,
      color: 'bg-purple-500',
    },
    {
      title: 'المهام والتقويم',
      href: '/tasks',
      icon: CalendarCheck,
      color: 'bg-orange-500',
    },
    {
      title: 'إدارة الأقسام',
      href: '/management',
      icon: TrendingUp,
      color: 'bg-teal-500',
    },
  ];

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
        {/* --- Header --- */}
        <header className="pt-8 mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-primary/50"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-md text-muted-foreground">أهلاً بعودتك،</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {user.displayName || 'مستخدمنا العزيز'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && <NotificationsPopover user={user} />}
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          <AdMarquee />
        </header>

        {/* --- Quick Stats --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                مهام اليوم
              </CardTitle>
              <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {quickStats.todayTasks}
                </div>
              )}
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                مهام غير مكتملة لهذا اليوم
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/50 dark:to-sky-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                دخل هذا الشهر
              </CardTitle>
              <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {quickStats.monthlyIncome.toFixed(3)}
                  <span className="text-lg font-normal"> د.ك</span>
                </div>
              )}
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                إجمالي المبيعات منذ بداية الشهر
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Quick Access --- */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3">وصول سريع</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickAccessLinks.map((link) => (
              <Link href={link.href} key={link.title}>
                <div
                  className={cn(
                    'p-4 rounded-lg text-white flex flex-col justify-between h-24 hover:scale-105 transition-transform duration-200',
                    link.color
                  )}
                >
                  <link.icon className="h-6 w-6" />
                  <span className="font-semibold text-sm">{link.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* --- Community Feed Header --- */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">خلاصة المجتمع</h2>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => setAddTopicOpen(true)}
          >
            <Plus className="h-4 w-4 ml-2" />
            <span>شارك فكرة</span>
          </Button>
        </div>

        <HomeView
          user={user}
          topics={topics || []}
          loading={topicsLoading}
          error={topicsError}
          onRefresh={refetch}
        />
      </main>

      <Toaster />
      <AddTopicDialog
        isOpen={isAddTopicOpen}
        setIsOpen={setAddTopicOpen}
        onTopicAdded={handleTopicAdded}
      />
    </div>
  );
}
