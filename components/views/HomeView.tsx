'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  collectionGroup,
  where,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import Image from 'next/image';
import { db, storage, auth } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import type { User } from 'firebase/auth';

import {
  Loader2,
  Newspaper,
  Trash2,
  Leaf,
  Plus,
  X,
  Lock,
  Globe,
  AlertCircle,
  Pencil,
} from 'lucide-react';
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

type Topic = {
  id: string;
  path: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  isPublic?: boolean;
  createdAt?: Timestamp | any;
  userId?: string;
  authorName?: string;
  [k: string]: any;
};

// --- Firestore & Storage Helper Functions ---

async function createTopic(
  title: string,
  description: string,
  isPublic: boolean,
  file?: File
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('يجب تسجيل الدخول لإنشاء موضوع.');

  const topicCollection = collection(db, 'users', currentUser.uid, 'topics');
  const topicRef = doc(topicCollection); // Create a reference with a new ID

  let imageUrl: string | null = null;
  let imagePath: string | null = null;

  if (file) {
    imagePath = `users/${currentUser.uid}/topics/${topicRef.id}/${file.name}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, file);
    imageUrl = await getDownloadURL(imageRef);
  }

  await setDoc(topicRef, {
    title: title.trim(),
    description: description.trim(),
    userId: currentUser.uid,
    authorName: currentUser.displayName || 'مستخدم غير معروف',
    isPublic,
    createdAt: serverTimestamp(),
    imageUrl,
    imagePath,
  });
}

async function updateTopic(
  topic: Topic,
  newData: {
    title: string;
    description: string;
    isPublic: boolean;
    file?: File;
    imageRemoved: boolean;
  }
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('مستخدم غير مصرح له.');
  if (currentUser.uid !== topic.userId)
    throw new Error('لا يمكنك تعديل هذا الموضوع.');

  const topicRef = doc(db, topic.path);
  const updateData: any = {
    title: newData.title.trim(),
    description: newData.description.trim(),
    isPublic: newData.isPublic,
  };

  let newImagePath: string | null = topic.imagePath || null;
  let newImageUrl: string | null = topic.imageUrl || null;

  // Case 1: New file is uploaded
  if (newData.file) {
    // Delete the old image if it exists
    if (topic.imagePath) {
      const oldImageRef = ref(storage, topic.imagePath);
      await deleteObject(oldImageRef).catch((e) =>
        console.warn('Failed to delete old image, it might not exist:', e)
      );
    }
    // Upload the new image
    newImagePath = `users/${currentUser.uid}/topics/${topic.id}/${newData.file.name}`;
    const newImageRef = ref(storage, newImagePath);
    await uploadBytes(newImageRef, newData.file);
    newImageUrl = await getDownloadURL(newImageRef);
  }
  // Case 2: Existing image is removed
  else if (newData.imageRemoved && topic.imagePath) {
    const oldImageRef = ref(storage, topic.imagePath);
    await deleteObject(oldImageRef).catch((e) =>
      console.warn('Failed to delete old image:', e)
    );
    newImagePath = null;
    newImageUrl = null;
  }
  
  updateData.imagePath = newImagePath;
  updateData.imageUrl = newImageUrl;

  await updateDoc(topicRef, updateData);
}

// --- Reusable Dialog Component for Add/Edit ---
function TopicDialog({
  isOpen,
  setIsOpen,
  onSave,
  isSaving,
  initialTopic,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  initialTopic?: Topic | null;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [imageRemoved, setImageRemoved] = useState(false);
  
  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setFile(undefined);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(undefined);
    setImageRemoved(false);
  }, [preview]);

  useEffect(() => {
    if (isOpen) {
        if (initialTopic) {
            setTitle(initialTopic.title || '');
            setDescription(initialTopic.description || '');
            setIsPublic(initialTopic.isPublic ?? true);
            setPreview(initialTopic.imageUrl);
        } else {
            clearForm();
        }
    } else {
        clearForm();
    }
  }, [isOpen, initialTopic, clearForm]);
  
  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(undefined);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setImageRemoved(false);
    }
  };

  const clearFile = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview(undefined);
    setImageRemoved(true);
    const fileInput = document.getElementById('topic-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleSave = async () => {
     if (!title.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'عنوان الموضوع مطلوب.' });
      return;
    }
    await onSave({ title, description, isPublic, file, imageRemoved });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialTopic ? 'تعديل الموضوع' : 'أضف فكرة أو موضوع جديد'}</DialogTitle>
          <DialogDescription>
            {initialTopic ? 'قم بتحديث تفاصيل موضوعك أدناه.' : 'شارك فكرة، نصيحة، أو سؤال مع مجتمع المزارعين.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="topic-title">عنوان الموضوع</Label>
            <Input id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: أفضل طريقة لتسميد الطماطم" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-description">الوصف (اختياري)</Label>
            <Textarea id="topic-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اشرح فكرتك بتفصيل أكبر..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic-file">صورة أو فيديو (اختياري)</Label>
            <Input id="topic-file" type="file" onChange={handleFileChange} accept="image/*,video/*" />
          </div>
          {preview && (
            <div className="relative">
              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
              { (file?.type.startsWith('image/') || preview.includes('firebasestorage')) && !file?.type.startsWith('video/') ? (
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
            {isSaving ? (initialTopic ? 'جاري الحفظ...' : 'جاري النشر...') : (initialTopic ? 'حفظ التعديلات' : 'نشر الموضوع')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function HomeView({ user }: { user: User }) {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetching logic
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    // Query for public topics
    const publicQ = query(
      collectionGroup(db, 'topics'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    const publicUnsub = onSnapshot(publicQ, 
      (snap) => processSnapshots(snap, 'public'),
      (e) => handleSnapshotError(e, 'public')
    );

    // Query for user's own topics
    const userQ = query(
      collection(db, 'users', user.uid, 'topics'),
      orderBy('createdAt', 'desc')
    );
    const userUnsub = onSnapshot(userQ, 
      (snap) => processSnapshots(snap, 'user'),
      (e) => handleSnapshotError(e, 'user')
    );

    const topicStore = { public: [] as Topic[], user: [] as Topic[] };

    function processSnapshots(snap: QuerySnapshot<DocumentData>, type: 'public' | 'user') {
      topicStore[type] = snap.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() } as Topic));
      
      const merged = [...topicStore.user, ...topicStore.public];
      const map = new Map<string, Topic>();
      merged.forEach(t => map.set(t.id, t));
      const deduped = Array.from(map.values());
      
      deduped.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

      setTopics(deduped);
      setLoading(false);
    }
    
    function handleSnapshotError(e: any, label: string) {
        console.error(`[${label}] snapshot error:`, e);
        setError('حدث خطأ أثناء جلب المواضيع. قد تكون مشكلة في الاتصال أو صلاحيات الوصول.');
        setLoading(false);
    }
    
    return () => {
      publicUnsub();
      userUnsub();
    };
  }, [user]);

  // --- Handlers ---

  const handleSaveNewTopic = async (data: any) => {
    setIsSaving(true);
    try {
      await createTopic(data.title, data.description, data.isPublic, data.file);
      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${data.title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });
      setIsAddDialogOpen(false);
    } catch (e: any) {
      console.error('Error saving topic: ', e);
      toast({ variant: 'destructive', title: 'خطأ في النشر', description: 'لم نتمكن من نشر موضوعك.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUpdatedTopic = async (data: any) => {
    if (!topicToEdit) return;
    setIsSaving(true);
    try {
      await updateTopic(topicToEdit, data);
      toast({
        title: 'تم التحديث بنجاح!',
        description: `تم تحديث موضوعك "${data.title}".`,
        className: 'bg-green-600 text-white',
      });
      setIsEditDialogOpen(false);
      setTopicToEdit(null);
    } catch (e: any)
    {
      console.error('Error updating topic: ', e);
      toast({ variant: 'destructive', title: 'خطأ في التحديث', description: 'لم نتمكن من حفظ التغييرات.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirmation = (topic: Topic) => {
    setTopicToDelete(topic);
    setShowDeleteConfirm(true);
  };

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await deleteDoc(doc(db, topicToDelete.path));
      if (topicToDelete.imagePath) {
        const imageRef = ref(storage, topicToDelete.imagePath);
        await deleteObject(imageRef);
      }
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الموضوع بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (e: any) {
      console.error("Error deleting topic:", e);
      toast({ variant: 'destructive', title: 'خطأ في الحذف', description: 'لم نتمكن من حذف الموضوع.' });
    } finally {
      setShowDeleteConfirm(false);
      setTopicToDelete(null);
    }
  };
  
  const openEditDialog = (topic: Topic) => {
    setTopicToEdit(topic);
    setIsEditDialogOpen(true);
  }

  const canDelete = (topic: Topic) => isAdmin || (user && topic.userId === user.uid);
  const canEdit = (topic: Topic) => user && topic.userId === user.uid;


  return (
    <div className="space-y-12">
      <header className="text-center space-y-4 pt-8">
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary text-sm py-1 px-4"
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
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                أضف فكرتك
            </Button>
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

        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>حدث خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && topics.length === 0 && !error && (
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
                className="group relative flex flex-col overflow-hidden bg-card/50 shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border"
              >
                <div className="absolute top-2 left-2 z-10 flex gap-2">
                    {canEdit(topic) && (
                        <Button
                        variant="default"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openEditDialog(topic)}
                        >
                        <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    {canDelete(topic) && (
                        <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openDeleteConfirmation(topic)}
                        >
                        <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {topic.imageUrl ? (
                    <Image
                      src={topic.imageUrl}
                      alt={topic.title || 'Topic Image'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 z-10">
                    {topic.isPublic ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700"
                      >
                        <Globe className="h-3 w-3 ml-1" />
                        عام
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700"
                      >
                        <Lock className="h-3 w-3 ml-1" />
                        خاص
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between p-4 bg-background/80">
                  <div>
                    <CardTitle className="text-lg mb-1 leading-tight">
                      {topic.title}
                    </CardTitle>
                    {topic.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  {topic.authorName && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                      بواسطة: {topic.authorName}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

        {/* Add Dialog */}
        <TopicDialog 
            isOpen={isAddDialogOpen}
            setIsOpen={setIsAddDialogOpen}
            onSave={handleSaveNewTopic}
            isSaving={isSaving}
        />

        {/* Edit Dialog */}
        {topicToEdit && (
            <TopicDialog 
                isOpen={isEditDialogOpen}
                setIsOpen={setIsEditDialogOpen}
                onSave={handleSaveUpdatedTopic}
                isSaving={isSaving}
                initialTopic={topicToEdit}
            />
        )}


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
