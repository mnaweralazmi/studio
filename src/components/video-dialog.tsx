
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/language-context';
import { PlusCircle, Upload, Image as ImageIcon } from 'lucide-react';
import type { VideoSection } from '@/app/page';
import Image from 'next/image';

const videoFormSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
  duration: z.string().min(3, "المدة مطلوبة"),
  image: z.string().min(1, "الصورة مطلوبة"),
});

export type VideoFormValues = z.infer<typeof videoFormSchema>;

interface VideoDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: VideoFormValues) => void;
  video?: VideoSection;
  setEditingVideo: (video: VideoSection | undefined) => void;
}

export function VideoDialog({ isOpen, setIsOpen, onSubmit, video, setEditingVideo }: VideoDialogProps) {
  const { t, language } = useLanguage();

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: { title: "", duration: "", image: "" },
  });

  React.useEffect(() => {
    if (video) {
      form.reset({
        title: video.title || t(video.titleKey),
        duration: video.duration || t(video.durationKey),
        image: video.image,
      });
    } else {
      form.reset({ title: "", duration: "", image: "" });
    }
  }, [video, form, t]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        setEditingVideo(undefined);
        form.reset();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const imagePreview = form.watch('image');

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
          <Button>
            <PlusCircle className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
            {t('addVideo')}
          </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{video ? t('editVideo') : t('addVideo')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>{t('title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="duration" render={({ field }) => ( <FormItem><FormLabel>{t('duration')}</FormLabel><FormControl><Input placeholder={t('durationPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField
                control={form.control}
                name="image"
                render={() => (
                <FormItem>
                    <FormLabel>{t('image')}</FormLabel>
                     <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-md border flex items-center justify-center bg-muted/50 overflow-hidden">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" width={96} height={96} className="object-cover w-full h-full" />
                        ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        )}
                        </div>
                        <Button asChild variant="outline">
                            <label>
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
              <Button type="submit">{video ? t('saveChanges') : t('add')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    