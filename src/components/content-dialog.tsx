
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/context/language-context';
import { PlusCircle, Upload, Image as ImageIcon } from 'lucide-react';
import type { SubTopic, VideoSection } from '@/lib/topics-data';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const contentFormSchema = z.object({
  type: z.enum(['subtopic', 'video']),
  title: z.string().min(3, "العنوان مطلوب"),
  imageUrl: z.string().min(1, "الصورة مطلوبة"),
  description: z.string().optional(),
  duration: z.string().optional(),
  videoUrl: z.string().optional(),
}).refine(data => {
    if (data.type === 'subtopic') return !!data.description && data.description.length > 10;
    return true;
}, {
    message: "الوصف مطلوب للموضوع",
    path: ["description"],
}).refine(data => {
    if (data.type === 'video') return !!data.duration && data.duration.length > 3;
    return true;
}, {
    message: "المدة مطلوبة للفيديو",
    path: ["duration"],
}).refine(data => {
    if (data.type === 'video') return !!data.videoUrl && z.string().url().safeParse(data.videoUrl).success;
    return true;
}, {
    message: "رابط الفيديو مطلوب وصحيح",
    path: ["videoUrl"],
});


export type ContentFormValues = z.infer<typeof contentFormSchema>;

interface ContentDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: ContentFormValues) => void;
  content?: {type: 'subtopic' | 'video', data: SubTopic | VideoSection};
  setEditingContent: (content: {type: 'subtopic' | 'video', data: SubTopic | VideoSection} | undefined) => void;
}

export function ContentDialog({ isOpen, setIsOpen, onSubmit, content, setEditingContent }: ContentDialogProps) {
  const { t } = useLanguage();

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: { type: 'subtopic', title: "", description: "", imageUrl: "", duration: "", videoUrl: "" },
  });

  React.useEffect(() => {
    if (content) {
        if (content.type === 'subtopic') {
            const data = content.data as SubTopic;
            form.reset({
                type: 'subtopic',
                title: data.titleKey === 'custom' ? data.title : t(data.titleKey as any),
                description: data.descriptionKey === 'custom' ? data.description : t(data.descriptionKey as any),
                imageUrl: data.image,
            });
        } else {
             const data = content.data as VideoSection;
            form.reset({
                type: 'video',
                title: data.titleKey === 'custom' ? data.title : t(data.titleKey as any),
                duration: data.durationKey === 'custom' ? data.duration : t(data.durationKey as any),
                imageUrl: data.image,
                videoUrl: data.videoUrl,
            });
        }
    } else {
      form.reset({ type: 'subtopic', title: "", description: "", imageUrl: "", duration: "", videoUrl: "" });
    }
  }, [content, form, t, isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingContent(undefined);
      form.reset();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDialogSubmit = (data: ContentFormValues) => {
      onSubmit(data);
      handleOpenChange(false);
  }

  const imagePreview = form.watch('imageUrl');
  const contentType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => handleOpenChange(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addContent')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{content ? t('editContent') : t('addContent')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDialogSubmit)} className="space-y-4">
            
            <FormField control={form.control} name="type" render={({ field }) => ( 
                <FormItem className="space-y-3">
                    <FormLabel>{t('contentType')}</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={!!content}>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="subtopic" id="r1" /></FormControl>
                                <Label htmlFor="r1">{t('subTopic')}</Label>
                            </FormItem>
                             <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl><RadioGroupItem value="video" id="r2" /></FormControl>
                                <Label htmlFor="r2">{t('video')}</Label>
                            </FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}/>

            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>{t('title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            {contentType === 'subtopic' && (
                <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>{t('description')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            )}

            {contentType === 'video' && (
                <>
                    <FormField control={form.control} name="duration" render={({ field }) => ( <FormItem><FormLabel>{t('duration')}</FormLabel><FormControl><Input placeholder={t('durationPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="videoUrl" render={({ field }) => ( <FormItem><FormLabel>{t('videoUrl')}</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                </>
            )}
            
            <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                <FormItem>
                    <FormLabel>{contentType === 'subtopic' ? t('image') : t('thumbnail')}</FormLabel>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted/50 overflow-hidden">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" width={96} height={96} className="object-cover w-full h-full" />
                        ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        )}
                        </div>
                        <Button asChild variant="outline">
                            <label className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" />
                                {t('uploadImage')}
                                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
                            </label>
                        </Button>
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit">{content ? t('saveChanges') : t('add')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    