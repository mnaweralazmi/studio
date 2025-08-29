
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
import type { AgriculturalSection } from '@/lib/topics-data';
import Image from 'next/image';

const topicFormSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
  description: z.string().min(10, "الوصف مطلوب"),
  image: z.string().min(1, "الصورة مطلوبة"),
  iconName: z.string().min(1, "اسم الأيقونة مطلوب"),
});

export type TopicFormValues = z.infer<typeof topicFormSchema>;

interface TopicDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (data: TopicFormValues) => void;
  topic?: AgriculturalSection;
  setEditingTopic: (topic: AgriculturalSection | undefined) => void;
}

export function TopicDialog({ isOpen, setIsOpen, onSubmit, topic, setEditingTopic }: TopicDialogProps) {
  const { t } = useLanguage();

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: { title: "", description: "", image: "", iconName: 'Sprout' },
  });

  React.useEffect(() => {
    if (topic) {
        const title = topic.titleKey === 'custom' && topic.title ? topic.title : t(topic.titleKey as any);
        const description = topic.descriptionKey === 'custom' && topic.description ? topic.description : t(topic.descriptionKey as any);
      form.reset({
        title: title,
        description: description,
        image: topic.image,
        iconName: topic.iconName,
      });
    } else {
      form.reset({ title: "", description: "", image: "", iconName: 'Sprout' });
    }
  }, [topic, form, t, isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingTopic(undefined);
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
  
  const handleDialogSubmit = (data: TopicFormValues) => {
      onSubmit(data);
      handleOpenChange(false);
  }

  const imagePreview = form.watch('image');

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addTopic')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{topic ? t('editTopic') : t('addTopic')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDialogSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>{t('title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>{t('description')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            
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

            <FormField control={form.control} name="iconName" render={({ field }) => ( 
              <FormItem>
                <FormLabel>{t('iconNameLucide')}</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. Sprout" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem> 
            )} />

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit">{topic ? t('saveChanges') : t('add')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    

    