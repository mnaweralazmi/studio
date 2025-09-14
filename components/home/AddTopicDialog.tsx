'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  DocumentData,
  getDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { User } from 'firebase/auth';

import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function AddTopicDialog({ user }: { user: User }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const objectUrl = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setPreview(objectUrl);
    }
  };

  const clearFile = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(undefined);
    setPreview(undefined);
    const fileInput = document.getElementById('idea-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, [preview]);

  const clearForm = useCallback(() => {
    setTitle('');
    setDescription('');
    clearFile();
  }, [clearFile]);

  // Cleanup effect to revoke URL on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleSave = async () => {
    if (!title.trim() || !user) {
      return;
    }
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const authorName = userDocSnap.exists()
        ? userDocSnap.data().displayName
        : 'مستخدم غير معروف';

      const topicData: DocumentData = {
        title: title,
        description: description,
        ownerId: user.uid,
        authorName: authorName,
        createdAt: serverTimestamp(),
      };

      if (file) {
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        const filePath = `topics/${user.uid}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        if (fileType === 'image') {
          topicData.imageUrl = fileUrl;
        } else {
          topicData.videoUrl = fileUrl;
        }
        topicData.fileType = fileType;
      }

      await addDoc(collection(db, 'topics'), topicData);

      toast({
        title: 'تم النشر بنجاح!',
        description: `تمت إضافة موضوعك "${title}" بنجاح.`,
        className: 'bg-green-600 text-white',
      });

      clearForm();
      setOpen(false);
    } catch (e) {
      console.error('Error saving topic: ', e);
      toast({
        variant: 'destructive',
        title: 'خطأ في النشر',
        description: 'لم نتمكن من نشر موضوعك. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          clearForm();
        }
      }}
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
          <DialogDescription>
            شارك فكرة، نصيحة، أو سؤال مع مجتمع المزارعين.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="idea-title">عنوان الموضوع</Label>
            <Input
              id="idea-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: أفضل طريقة لتسميد الطماطم"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idea-description">الوصف (اختياري)</Label>
            <Textarea
              id="idea-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح فكرتك بتفصيل أكبر..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idea-file">صورة أو فيديو (اختياري)</Label>
            <Input
              id="idea-file"
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
              {file?.type.startsWith('image/') ? (
                <img
                  src={preview}
                  alt="Preview"
                  width={400}
                  height={200}
                  className="rounded-md object-cover w-full"
                />
              ) : (
                <video src={preview} controls className="rounded-md w-full" />
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
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isSaving ? 'جاري النشر...' : 'نشر الموضوع'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
