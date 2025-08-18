
"use client";

import * as React from 'react';
import * as Lucide from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { useTopics } from '@/context/topics-context';
import type { AgriculturalSection, VideoSection } from '@/lib/topics-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicDialog, TopicFormValues } from '@/components/topic-dialog';
import { VideoDialog, VideoFormValues } from '@/components/video-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const getIcon = (name: string) => {
    const Icon = Lucide[name as keyof typeof Lucide] as React.ElementType;
    return Icon ? <Icon className="h-8 w-8" /> : <Lucide.Sprout className="h-8 w-8" />;
};

export default function Home() {
  const { t, language } = useLanguage();
  const { topics, setTopics, videos, setVideos } = useTopics();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = React.useState(false);

  const [isTopicDialogOpen, setIsTopicDialogOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<AgriculturalSection | undefined>(undefined);
  
  const [isVideoDialogOpen, setIsVideoDialogOpen] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState<VideoSection | undefined>(undefined);

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        setIsAdmin(true);
      }
    }
  }, []);

  const handleTopicSubmit = (data: TopicFormValues) => {
    if (editingTopic) {
      // Edit existing topic
      setTopics(prevTopics => prevTopics.map(topic => 
        topic.id === editingTopic.id 
        ? { ...topic, 
            title: data.title,
            titleKey: 'custom',
            description: data.description,
            descriptionKey: 'custom',
            image: data.image,
            iconName: data.iconName
          } 
        : topic
      ));
      toast({ title: t('editTopicSuccess') });
    } else {
      // Add new topic
      const newTopic: AgriculturalSection = {
        id: crypto.randomUUID(),
        title: data.title,
        titleKey: 'custom',
        description: data.description,
        descriptionKey: 'custom',
        image: data.image,
        iconName: data.iconName,
        subTopics: [],
        hint: data.title.toLowerCase(),
      };
      setTopics(prevTopics => [...prevTopics, newTopic]);
      toast({ title: t('addTopicSuccess') });
    }
    setEditingTopic(undefined);
  };
  
  const handleDeleteTopic = (topicId: string) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicId));
      toast({ variant: 'destructive', title: t('deleteTopicSuccess') });
  }
  
  const handleEditTopic = (topic: AgriculturalSection) => {
      setEditingTopic(topic);
      setIsTopicDialogOpen(true);
  }

  const handleVideoSubmit = (data: VideoFormValues) => {
    if (editingVideo) {
      // Edit
      setVideos(prev => prev.map(v => v.id === editingVideo.id ? {
        ...v,
        title: data.title,
        titleKey: 'custom',
        duration: data.duration,
        durationKey: 'custom',
        image: data.image
      } : v));
       toast({ title: t('editVideoSuccess') });
    } else {
      // Add
      const newVideo: VideoSection = {
        id: crypto.randomUUID(),
        title: data.title,
        titleKey: 'custom',
        duration: data.duration,
        durationKey: 'custom',
        image: data.image,
        hint: data.title.toLowerCase(),
      };
      setVideos(prev => [...prev, newVideo]);
      toast({ title: t('addVideoSuccess') });
    }
    setEditingVideo(undefined);
  };

  const handleDeleteVideo = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
    toast({ variant: 'destructive', title: t('deleteVideoSuccess') });
  }

  const handleEditVideo = (video: VideoSection) => {
    setEditingVideo(video);
    setIsVideoDialogOpen(true);
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Lucide.Leaf className="h-5 w-5" />
            <span className="font-semibold">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>
        
        <section className="w-full border-t pt-8">
            <div className="flex justify-center items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-center">{t('agriculturalTopics')}</h2>
                {isAdmin && <TopicDialog isOpen={isTopicDialogOpen} setIsOpen={setIsTopicDialogOpen} onSubmit={handleTopicSubmit} topic={editingTopic} setEditingTopic={setEditingTopic} />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-8">
                {topics.map((topic) => {
                    const title = topic.titleKey === 'custom' && topic.title ? topic.title : t(topic.titleKey as any);
                    return (
                        <div key={topic.id} className="relative group/topic">
                            <Link href={`/topics/${topic.id}`} className="flex flex-col items-center gap-3 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover/topic:bg-primary/20 group-hover/topic:scale-110">
                                    {getIcon(topic.iconName)}
                                </div>
                                <p className="font-semibold text-sm text-foreground">{title}</p>
                            </Link>
                            {isAdmin && (
                                <div className="absolute top-0 right-0 flex flex-col gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleEditTopic(topic)}><Lucide.Pencil className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button size="icon" variant="destructive" className="h-7 w-7"><Lucide.Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>سيتم حذف "{title}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteTopic(topic.id)}>{t('confirmDelete')}</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>

        <section className="w-full border-t pt-8">
            <div className="flex justify-center items-center mb-8 gap-4">
                 <h2 className="text-3xl font-bold text-center">{t('educationalVideos')}</h2>
                {isAdmin && <VideoDialog isOpen={isVideoDialogOpen} setIsOpen={setIsVideoDialogOpen} onSubmit={handleVideoSubmit} video={editingVideo} setEditingVideo={setEditingVideo} />}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((video) => {
                    const title = video.titleKey === 'custom' && video.title ? video.title : t(video.titleKey as any);
                    const duration = video.durationKey === 'custom' && video.duration ? video.duration : t(video.durationKey as any);
                    return (
                        <div key={video.id} className="group/video relative">
                            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                                <CardHeader className="p-0 relative">
                                    <Image src={video.image} alt={title} width={600} height={400} className="w-full h-40 object-cover" data-ai-hint={video.hint} />
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">{duration}</div>
                                </CardHeader>
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <CardTitle className="mb-2 text-base flex-1">{title}</CardTitle>
                                </CardContent>
                            </Card>
                            {isAdmin && (
                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover/video:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleEditVideo(video)}><Lucide.Pencil className="h-4 w-4" /></Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="destructive" className="h-7 w-7"><Lucide.Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle><AlertDialogDescription>سيتم حذف فيديو "{title}" نهائياً.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteVideo(video.id)}>{t('confirmDelete')}</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>

        <footer className="text-center mt-16 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}

    