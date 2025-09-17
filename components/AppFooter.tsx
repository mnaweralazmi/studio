'use client';

import {
  CalendarDays,
  Tractor,
  Settings,
  Home,
  Landmark,
  Plus,
  Bell,
  Newspaper,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useAdmin } from '@/lib/hooks/useAdmin';
import NotificationsPopover from './home/NotificationsPopover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/use-toast';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

type TopicFormData = {
  title: string;
  description: string;
  file?: File;
  imageRemoved?: boolean;
};

async function createTopic(data: TopicFormData): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('يجب تسجيل الدخول لإنشاء موضوع.');

  const topicCollection = collection(db, 'users', currentUser.uid, 'topics');
  const topicRef = doc(topicCollection);

  const newTopic = {
    title: data.title.trim(),
    description: data.description.trim(),
    userId: currentUser.uid,
    authorName: currentUser.displayName || 'مستخدم غير معروف',
    createdAt: serverTimestamp() as Timestamp,
    imageUrl: '',
    imagePath: '',
    archived: false,
    isPublic: true,
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

function AddTopicDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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
    if (isOpen) {
      clearForm();
    } else {
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
      // You might want a way to trigger a refresh on the home page here
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
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isSaving ? 'جاري النشر...' : 'نشر الموضوع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function AppFooter({ activeView }: { activeView: string }) {
  const [user] = useAuthState(auth);
  const pathname = usePathname();
  const { isAdmin } = useAdmin();
  const [isAddTopicOpen, setAddTopicOpen] = useState(false);


  if (!user || pathname === '/login' || pathname === '/register') {
    return null;
  }
  
  const mainNavItems = [
    { id: 'home', label: 'الرئيسية', icon: Home, href: '/home', adminOnly: false },
    { id: 'tasks', label: 'المهام', icon: CalendarDays, href: '/tasks', adminOnly: false },
    { id: 'management', label: 'الإدارة', icon: Tractor, href: '/management', adminOnly: false },
    { id: 'budget', label: 'الميزانية', icon: Landmark, href: '/budget', adminOnly: false },
    { id: 'settings', label: 'الإعدادات', icon: Settings, href: '/settings', adminOnly: false },
  ];
  
  const adminNavItems = [
     { id: 'addTopic', label: 'إضافة', icon: Plus, action: () => setAddTopicOpen(true) },
     { id: 'notifications', label: 'الإشعارات', icon: Bell, component: <NotificationsPopover user={user} /> },
  ];


  const NavLink = ({
    id,
    icon: Icon,
    label,
    isActive,
    href,
  }: {
    id: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    href: string;
  }) => {
    return (
      <Link href={href} className="w-full h-full">
        <div
          className={cn(
            'flex flex-col items-center justify-center text-muted-foreground/80 hover:text-primary w-full h-full relative',
          )}
        >
           {isActive && <div className="absolute top-0 h-1 w-12 rounded-b-full bg-primary" />}
          <Icon className={cn("h-6 w-6 transition-all", isActive && "text-primary scale-110")} />
          <span className={cn("text-xs mt-1 font-medium transition-all", isActive && "text-primary")}>{label}</span>
        </div>
      </Link>
    );
  };
  
  const ActionButton = ({
    id,
    icon: Icon,
    label,
    action,
    component,
  }: {
    id: string;
    icon: React.ElementType;
    label: string;
    action?: () => void;
    component?: React.ReactNode;
  }) => {
      if (component) {
          return (
             <div className="w-full h-full flex flex-col items-center justify-center">
                 {component}
             </div>
          )
      }
      return (
         <div onClick={action} className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/80 hover:text-primary cursor-pointer">
            <Icon className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">{label}</span>
         </div>
      )
  }

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-white/10 shadow-t-strong z-50">
        <nav className="flex justify-around items-center h-20">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.id}
              id={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              isActive={activeView === item.id}
            />
          ))}
          {isAdmin && adminNavItems.map((item) => (
             <ActionButton key={item.id} {...item} />
          ))}
        </nav>
      </footer>
       {isAdmin && <AddTopicDialog isOpen={isAddTopicOpen} setIsOpen={setAddTopicOpen} />}
    </>
  );
}