
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Leaf, Droplets, Bug, Scissors, Sprout, Wheat, PlayCircle, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';

interface User {
  username: string;
  role: 'admin' | 'user';
  name: string;
}

interface AgriculturalSection {
  id: string;
  titleKey: keyof typeof import('@/locales/ar.json');
  iconName: keyof typeof iconComponents;
  descriptionKey: keyof typeof import('@/locales/ar.json');
  image: string;
  hint: string;
}

interface VideoSection {
  id: string;
  titleKey: keyof typeof import('@/locales/ar.json');
  durationKey: keyof typeof import('@/locales/ar.json');
  image: string;
  hint: string;
}

const iconComponents = {
  Droplets,
  Bug,
  Scissors,
  Sprout,
  Wheat
};

const initialAgriculturalSections: AgriculturalSection[] = [
    { id: '1', titleKey: 'topicIrrigation', iconName: 'Droplets', descriptionKey: 'topicIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'watering plants' },
    { id: '2', titleKey: 'topicPests', iconName: 'Bug', descriptionKey: 'topicPestsDesc', image: 'https://placehold.co/600x400.png', hint: 'plant pest' },
    { id: '3', titleKey: 'topicPruning', iconName: 'Scissors', descriptionKey: 'topicPruningDesc', image: 'https://placehold.co/600x400.png', hint: 'pruning shears' },
    { id: '4', titleKey: 'topicSoil', iconName: 'Sprout', descriptionKey: 'topicSoilDesc', image: 'https://placehold.co/600x400.png', hint: 'soil fertilizer' },
];

const initialVideoSections: VideoSection[] = [
    { id: '1', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://placehold.co/1600x900.png', hint: 'gardening tools' },
    { id: '2', titleKey: 'videoGrowingTomatoes', durationKey: 'videoDuration15', image: 'https://placehold.co/1600x900.png', hint: 'tomato plant' },
    { id: '3', titleKey: 'videoComposting', durationKey: 'videoDuration20', image: 'https://placehold.co/1600x900.png', hint: 'compost pile' }
];

const topicFormSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
  description: z.string().min(10, "الوصف مطلوب"),
  image: z.string().url("رابط الصورة غير صالح"),
  iconName: z.enum(Object.keys(iconComponents) as [keyof typeof iconComponents]),
});

const videoFormSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
  duration: z.string().min(3, "المدة مطلوبة"),
  image: z.string().url("رابط الصورة غير صالح"),
});

export default function Home() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [user, setUser] = React.useState<User | null>(null);
  const [agriculturalSections, setAgriculturalSections] = React.useState<any[]>([]);
  const [videoSections, setVideoSections] = React.useState<any[]>([]);
  
  const [isTopicDialogOpen, setTopicDialogOpen] = React.useState(false);
  const [isVideoDialogOpen, setVideoDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedTopics = localStorage.getItem('agriculturalSections');
    setAgriculturalSections(storedTopics ? JSON.parse(storedTopics) : initialAgriculturalSections);

    const storedVideos = localStorage.getItem('videoSections');
    setVideoSections(storedVideos ? JSON.parse(storedVideos) : initialVideoSections);
  }, []);

  const isAdmin = user?.role === 'admin';

  const topicForm = useForm<z.infer<typeof topicFormSchema>>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: { title: "", description: "", image: "", iconName: 'Sprout' },
  });

  const videoForm = useForm<z.infer<typeof videoFormSchema>>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: { title: "", duration: "", image: "" },
  });
  
  function onAddTopic(data: z.infer<typeof topicFormSchema>) {
    const newTopic = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      iconName: data.iconName,
      image: data.image,
      hint: data.title.toLowerCase().split(" ").slice(0,2).join(" "),
    };
    const updatedSections = [...agriculturalSections, newTopic];
    setAgriculturalSections(updatedSections);
    localStorage.setItem('agriculturalSections', JSON.stringify(updatedSections));
    toast({ title: "تمت إضافة الموضوع بنجاح!" });
    topicForm.reset();
    setTopicDialogOpen(false);
  }

  function onAddVideo(data: z.infer<typeof videoFormSchema>) {
    const newVideo = {
        id: crypto.randomUUID(),
        title: data.title,
        duration: data.duration,
        image: data.image,
        hint: data.title.toLowerCase().split(" ").slice(0,2).join(" "),
    };
    const updatedVideos = [...videoSections, newVideo];
    setVideoSections(updatedVideos);
    localStorage.setItem('videoSections', JSON.stringify(updatedVideos));
    toast({ title: "تمت إضافة الفيديو بنجاح!" });
    videoForm.reset();
    setVideoDialogOpen(false);
  }
  
  function deleteTopic(id: string) {
    const updatedSections = agriculturalSections.filter(s => s.id !== id);
    setAgriculturalSections(updatedSections);
    localStorage.setItem('agriculturalSections', JSON.stringify(updatedSections));
    toast({ variant: "destructive", title: "تم حذف الموضوع." });
  }

  function deleteVideo(id: string) {
    const updatedVideos = videoSections.filter(v => v.id !== id);
    setVideoSections(updatedVideos);
    localStorage.setItem('videoSections', JSON.stringify(updatedVideos));
    toast({ variant: "destructive", title: "تم حذف الفيديو." });
  }


  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-16">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary-foreground">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>

        <section className="w-full">
            <div className="flex justify-center items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-center">{t('agriculturalTopics')}</h2>
                 {isAdmin && (
                  <Dialog open={isTopicDialogOpen} onOpenChange={setTopicDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                        {t('addTopic')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة موضوع زراعي جديد</DialogTitle>
                      </DialogHeader>
                      <Form {...topicForm}>
                        <form onSubmit={topicForm.handleSubmit(onAddTopic)} className="space-y-4">
                          <FormField control={topicForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={topicForm.control} name="description" render={({ field }) => ( <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={topicForm.control} name="image" render={({ field }) => ( <FormItem><FormLabel>رابط الصورة</FormLabel><FormControl><Input placeholder="https://placehold.co/600x400.png" {...field} /></FormControl><FormMessage /></FormItem> )} />
                           <FormField control={topicForm.control} name="iconName" render={({ field }) => ( <FormItem><FormLabel>الأيقونة</FormLabel><FormControl><select {...field} className="w-full p-2 border rounded-md bg-background"><option value="Droplets">قطرات</option><option value="Bug">حشرة</option><option value="Scissors">مقص</option><option value="Sprout">برعم</option><option value="Wheat">قمح</option></select></FormControl><FormMessage /></FormItem> )} />
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit">إضافة</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {agriculturalSections.map((section) => {
                    const Icon = iconComponents[section.iconName as keyof typeof iconComponents] || Sprout;
                    const title = section.titleKey ? t(section.titleKey) : section.title;
                    const description = section.descriptionKey ? t(section.descriptionKey) : section.description;
                    return (
                    <Card key={section.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group relative">
                        <CardHeader className="p-0">
                             <Image src={section.image} alt={title} width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={section.hint} />
                        </CardHeader>
                        <CardContent className="p-6">
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <Icon className="h-6 w-6 text-primary" />
                                <span>{title}</span>
                            </CardTitle>
                            <p className="text-muted-foreground">{description}</p>
                        </CardContent>
                        {isAdmin && (
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteTopic(section.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </Card>
                )})}
            </div>
        </section>

        <section className="w-full">
             <div className="flex justify-center items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-center">{t('educationalVideos')}</h2>
                {isAdmin && (
                   <Dialog open={isVideoDialogOpen} onOpenChange={setVideoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                        {t('addVideo')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة فيديو تعليمي جديد</DialogTitle>
                      </DialogHeader>
                      <Form {...videoForm}>
                        <form onSubmit={videoForm.handleSubmit(onAddVideo)} className="space-y-4">
                          <FormField control={videoForm.control} name="title" render={({ field }) => ( <FormItem><FormLabel>العنوان</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={videoForm.control} name="duration" render={({ field }) => ( <FormItem><FormLabel>المدة</FormLabel><FormControl><Input placeholder="مثال: 15 دقيقة" {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <FormField control={videoForm.control} name="image" render={({ field }) => ( <FormItem><FormLabel>رابط الصورة المصغرة</FormLabel><FormControl><Input placeholder="https://placehold.co/1600x900.png" {...field} /></FormControl><FormMessage /></FormItem> )} />
                          <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                            <Button type="submit">إضافة</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {videoSections.map((video) => {
                const title = video.titleKey ? t(video.titleKey) : video.title;
                const duration = video.durationKey ? t(video.durationKey) : video.duration;
                return (
                <Card key={video.id} className="overflow-hidden group cursor-pointer shadow-lg relative">
                    <div className="relative">
                        <Image src={video.image} alt={title} width={1600} height={900} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={video.hint} />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <PlayCircle className="h-16 w-16 text-white/80 group-hover:text-white transition-colors"/>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="text-sm text-muted-foreground">{duration}</p>
                    </CardContent>
                    {isAdmin && (
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteVideo(video.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </Card>
              )})}
            </div>
        </section>

        <footer className="text-center mt-8 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}
