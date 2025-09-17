'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  collectionGroup,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  setDoc,
  writeBatch,
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
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import {
  Loader2,
  Newspaper,
  Plus,
  X,
  Lock,
  Globe,
  AlertCircle,
  Pencil,
  Save,
  Archive,
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import NotificationsPopover from '@/components/home/NotificationsPopover';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import AdMarquee from '../home/AdMarquee';

type Topic = {
  id: string;
  path: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  isPublic?: boolean;
  createdAt?: Timestamp;
  userId?: string;
  authorName?: string;
  [k: string]: any;
};

type TopicFormData = {
  title: string;
  description: string;
  file?: File;
  imageRemoved?: boolean;
};


// --- Firestore & Storage Helper Functions ---

async function createTopic(
  data: TopicFormData
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('يجب تسجيل الدخول لإنشاء موضوع.');

  const topicCollection = collection(db, 'users', currentUser.uid, 'topics');
  const topicRef = doc(topicCollection); // Create a ref with a new ID

  const newTopic: Omit<Topic, 'id'|'path'> = {
    title: data.title.trim(),
    description: data.description.trim(),
    userId: currentUser.uid,
    authorName: currentUser.displayName || 'مستخدم غير معروف',
    isPublic: true, // All topics are public by default now
    createdAt: serverTimestamp() as Timestamp,
    imageUrl: '',
    imagePath: '',
    archived: false,
  };
  
  if (data.file) {
    const imagePath = `users/${currentUser.uid}/topics/${topicRef.id}/${data.file.name}`;
    const imageRef = ref(storage, imagePath);
    await uploadBytes(imageRef, data.file);
    newTopic.imageUrl = await getDownloadURL(imageRef);
    newTopic.imagePath = imagePath;
  }

  await setDoc(topicRef, newTopic);
}

async function updateTopic(
  topic: Topic,
  newData: TopicFormData
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('مستخدم غير مصرح له.');
  if (currentUser.uid !== topic.userId)
    throw new Error('لا يمكنك تعديل هذا الموضوع.');

  const topicRef = doc(db, topic.path);
  const updateData: any = {
    title: newData.title.trim(),
    description: newData.description.trim(),
  };

  // Case 1: New file is uploaded, replacing the old one
  if (newData.file) {
    // Delete the old image if it exists
    if (topic.imagePath) {
      const oldImageRef = ref(storage, topic.imagePath);
      await deleteObject(oldImageRef).catch((e) =>
        console.warn('Failed to delete old image, it might not exist:', e)
      );
    }
    // Upload the new image
    const newImagePath = `users/${currentUser.uid}/topics/${topic.id}/${newData.file.name}`;
    const newImageRef = ref(storage, newImagePath);
    await uploadBytes(newImageRef, newData.file);
    updateData.imageUrl = await getDownloadURL(newImageRef);
    updateData.imagePath = newImagePath;
  }
  // Case 2: Existing image is removed without replacement
  else if (newData.imageRemoved && topic.imagePath) {
    const oldImageRef = ref(storage, topic.imagePath);
    await deleteObject(oldImageRef).catch((e) =>
      console.warn('Failed to delete old image:', e)
    );
    updateData.imagePath = '';
    updateData.imageUrl = '';
  }

  await updateDoc(topicRef, updateData);
}

async function archiveTopic(topic: Topic): Promise<void> {
    const topicRef = doc(db, topic.path);
    await updateDoc(topicRef, { archived: true });
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
  onSave: (data: TopicFormData) => Promise<void>;
  isSaving: boolean;
  initialTopic?: Topic | null;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [imageRemoved, setImageRemoved] = useState(false);
  
  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setFile(undefined);
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(undefined);
    setImageRemoved(false);
  }, [preview]);

  useEffect(() => {
    if (isOpen) {
        if (initialTopic) {
            setTitle(initialTopic.title || '');
            setDescription(initialTopic.description || '');
            setPreview(initialTopic.imageUrl);
            setImageRemoved(false); // Reset on open
        } else {
            clearForm();
        }
    } else {
        // Delay clearing form to prevent flash of empty content
        setTimeout(clearForm, 300);
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
    // Clear previous blob object if exists
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setImageRemoved(false); // A new file is selected, so we are not removing the image.
    } else {
      // No file selected, clear file and preview
      setFile(undefined);
      setPreview(initialTopic?.imageUrl || undefined); // Revert to initial if available
    }
  };

  const clearFile = () => {
    // Clear blob
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);

    setFile(undefined);
    setPreview(undefined);
    setImageRemoved(true);

    // Reset the file input element
    const fileInput = document.getElementById('topic-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleSave = async () => {
     if (!title.trim()) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'عنوان الموضوع مطلوب.' });
      return;
    }
    await onSave({ title, description, file, imageRemoved });
  };

  const isVideo = useMemo(() => {
      if (file) return file.type.startsWith('video/');
      if (preview) {
         try {
             const url = new URL(preview);
             const path = url.pathname.toLowerCase();
             const search = url.search.toLowerCase();
             // Check for common video extensions in path or query params (for signed URLs)
             return path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.webm') ||
                    search.includes('.mp4') || search.includes('.mov') || search.includes('.webm');
         } catch(e) {
             // If preview is a data URI, check MIME type
             if (preview.startsWith('data:video')) return true;
             return false;
         }
      }
      return false;
  }, [file, preview]);

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
              { isVideo ? (
                 <video src={preview} controls className="rounded-md w-full" />
              ) : (
                <Image src={preview} alt="Preview" width={400} height={225} className="rounded-md object-cover w-full aspect-video" />
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : (initialTopic ? <Save className="h-4 w-4 ml-2" /> : <Plus className="h-4 w-4 ml-2" />)}
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

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [topicToArchive, setTopicToArchive] = useState<Topic | null>(null);

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetching logic
  useEffect(() => {
    setLoading(true);
    // This more robust query fetches all non-archived public topics
    // across all users. It's simpler and less prone to race conditions.
    const q = query(
        collectionGroup(db, 'topics'),
        where('archived', '!=', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedTopics = snapshot.docs.map(d => ({ id: d.id, path: d.ref.path, ...d.data() } as Topic));
        setTopics(fetchedTopics);
        setLoading(false);
        setError(null);
      },
      (e) => {
        console.error("Error fetching topics:", e);
        // Check for a specific Firestore error for missing indexes
        if (e.code === 'failed-precondition') {
          setError('حدث خطأ في قاعدة البيانات. قد يتطلب هذا الاستعلام فهرسًا مخصصًا. يرجى مراجعة سجلات Firestore.');
        } else {
          setError('حدث خطأ أثناء جلب المواضيع. قد تكون مشكلة في الاتصال أو صلاحيات الوصول.');
        }
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, []);

  // --- Handlers ---

  const handleSaveNewTopic = async (data: TopicFormData) => {
    setIsSaving(true);
    try {
      await createTopic(data);
      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${data.title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });
      setIsAddDialogOpen(false);
    } catch (e: any) {
      console.error('Error saving topic: ', e);
      toast({ variant: 'destructive', title: 'خطأ في النشر', description: e.message || 'لم نتمكن من نشر موضوعك.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUpdatedTopic = async (data: TopicFormData) => {
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
    } catch (e: any) {
      console.error('Error updating topic: ', e);
      toast({ variant: 'destructive', title: 'خطأ في التحديث', description: e.message || 'لم نتمكن من حفظ التغييرات.' });
    } finally {
      setIsSaving(false);
    }
  };

  const openArchiveConfirmation = (topic: Topic) => {
    setTopicToArchive(topic);
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirmed = async () => {
    if (!topicToArchive) return;
    try {
      await archiveTopic(topicToArchive);
      toast({
        title: 'تمت الأرشفة',
        description: 'تمت أرشفة الموضوع بنجاح.',
        className: 'bg-green-600 text-white',
      });
    } catch (e: any) {
      console.error("Error archiving topic:", e);
      toast({ variant: 'destructive', title: 'خطأ في الأرشفة', description: 'لم نتمكن من أرشفة الموضوع.' });
    } finally {
      setShowArchiveConfirm(false);
      setTopicToArchive(null);
    }
  };
  
  const openEditDialog = (topic: Topic) => {
    setTopicToEdit(topic);
    setIsEditDialogOpen(true);
  }

  const canModify = (topic: Topic) => isAdmin || (user && topic.userId === user.uid);
  const canEdit = (topic: Topic) => user && topic.userId === user.uid;


  return (
    <div className="space-y-12">
      <header className="flex flex-col items-center justify-between pt-8 sm:flex-row">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
            <Newspaper className="h-8 w-8 text-primary" />
           </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              المواضيع والنقاشات
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              اكتشف، شارك، وناقش الأفكار مع مجتمع المزارعين.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              أضف فكرتك
          </Button>
          <NotificationsPopover user={user} />
        </div>
      </header>

      <AdMarquee />

      <section>
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
            <p className="text-muted-foreground mt-2 mb-4">
              كن أول من يشارك فكرة أو موضوعًا جديدًا!
            </p>
             <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                أضف فكرتك الآن
            </Button>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {topics.map((topic) => (
              <Card
                key={topic.id}
                className="group flex flex-col overflow-hidden bg-card/50 shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  {topic.imageUrl ? (
                    (topic.imageUrl.includes('.mp4') || topic.imageUrl.includes('.mov') || topic.imageUrl.includes('video')) ? (
                       <video src={topic.imageUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <Image
                        src={topic.imageUrl}
                        alt={topic.title || 'Topic Image'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col p-4 bg-background/80">
                  <div className="flex-1">
                     <div className="flex justify-between items-start mb-2">
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
                         {topic.createdAt && (
                           <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(topic.createdAt.toDate(), { addSuffix: true, locale: ar })}
                           </p>
                        )}
                    </div>
                    <CardTitle className="text-lg mb-2 leading-tight hover:text-primary transition-colors">
                      {topic.title}
                    </CardTitle>
                    {topic.description && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                     {topic.authorName && (
                        <p className="text-xs text-muted-foreground">
                          بواسطة: {topic.authorName}
                        </p>
                      )}
                      <div className="flex gap-1">
                          {canEdit(topic) && (
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(topic)}
                            >
                            <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                        {canModify(topic) && (
                            <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => openArchiveConfirmation(topic)}
                            >
                            <Archive className="h-4 w-4" />
                            </Button>
                        )}
                      </div>
                  </div>
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


      <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الأرشفة</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في أرشفة هذا الموضوع؟ سيتم إخفاؤه من القائمة ونقله إلى الأرشيف.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleArchiveConfirmed}>
              نعم، قم بالأرشفة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
