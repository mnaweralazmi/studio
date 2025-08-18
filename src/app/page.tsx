
"use client";

import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import { Leaf, PlusCircle, Edit, Trash2, PlayCircle, BookOpen } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import type arTranslations from '@/locales/ar.json';
import { Button } from '@/components/ui/button';
import { TopicDialog, TopicFormValues } from '@/components/topic-dialog';
import { VideoDialog, VideoFormValues } from '@/components/video-dialog';
import { iconComponents, IconName } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


type TranslationKeys = keyof typeof arTranslations;

interface User {
  username: string;
  role: 'admin' | 'user';
  name: string;
}

export interface SubTopic {
  id: string;
  titleKey: TranslationKeys;
  descriptionKey: TranslationKeys;
  image: string;
  hint: string;
}

export interface AgriculturalSection {
  id: string;
  titleKey: TranslationKeys;
  iconName: IconName;
  descriptionKey: TranslationKeys;
  image: string;
  hint: string;
  subTopics: SubTopic[];
  title?: string;
  description?: string;
}

export interface VideoSection {
  id: string;
  titleKey: TranslationKeys;
  durationKey: TranslationKeys;
  image: string;
  hint: string;
  title?: string;
  duration?: string;
}

export const initialAgriculturalSections: AgriculturalSection[] = [
    { 
        id: '1', 
        titleKey: 'topicIrrigation', 
        iconName: 'Droplets', 
        descriptionKey: 'topicIrrigationDesc', 
        image: 'https://placehold.co/600x400.png', 
        hint: 'watering plants',
        subTopics: [
            { id: 'drip', titleKey: 'subTopicDripIrrigation', descriptionKey: 'subTopicDripIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'drip irrigation' },
            { id: 'sprinkler', titleKey: 'subTopicSprinklerIrrigation', descriptionKey: 'subTopicSprinklerIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'sprinkler irrigation' },
            { id: 'traditional', titleKey: 'subTopicTraditionalIrrigation', descriptionKey: 'subTopicTraditionalIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'traditional irrigation' },
            { id: 'modern', titleKey: 'subTopicModernIrrigation', descriptionKey: 'subTopicModernIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'modern irrigation' }
        ]
    },
    { 
        id: '2', 
        titleKey: 'topicPests', 
        iconName: 'Bug', 
        descriptionKey: 'topicPestsDesc', 
        image: 'https://placehold.co/600x400.png', 
        hint: 'plant pest',
        subTopics: [
            { id: 'natural', titleKey: 'subTopicNaturalPestControl', descriptionKey: 'subTopicNaturalPestControlDesc', image: 'https://placehold.co/600x400.png', hint: 'ladybug on leaf' },
            { id: 'chemical', titleKey: 'subTopicChemicalPesticides', descriptionKey: 'subTopicChemicalPesticidesDesc', image: 'https://placehold.co/600x400.png', hint: 'spraying pesticides' },
            { id: 'prevention', titleKey: 'subTopicPestPrevention', descriptionKey: 'subTopicPestPreventionDesc', image: 'https://placehold.co/600x400.png', hint: 'healthy plants' }
        ]
    },
    { 
        id: '3', 
        titleKey: 'topicPruning', 
        iconName: 'Scissors', 
        descriptionKey: 'topicPruningDesc', 
        image: 'https://placehold.co/600x400.png', 
        hint: 'pruning shears',
        subTopics: [
            { id: 'formative', titleKey: 'subTopicFormativePruning', descriptionKey: 'subTopicFormativePruningDesc', image: 'https://placehold.co/600x400.png', hint: 'young tree pruning' },
            { id: 'fruiting', titleKey: 'subTopicFruitingPruning', descriptionKey: 'subTopicFruitingPruningDesc', image: 'https://placehold.co/600x400.png', hint: 'pruning fruit tree' },
            { id: 'renewal', titleKey: 'subTopicRenewalPruning', descriptionKey: 'subTopicRenewalPruningDesc', image: 'https://placehold.co/600x400.png', hint: 'old branch cutting' }
        ]
    }
];

const initialVideoSections: VideoSection[] = [
    { id: '1', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://placehold.co/1600x900.png', hint: 'gardening tools' },
    { id: '2', titleKey: 'videoGrowingTomatoes', durationKey: 'videoDuration15', image: 'https://placehold.co/1600x900.png', hint: 'tomato plant' },
    { id: '3', titleKey: 'videoComposting', durationKey: 'videoDuration20', image: 'https://placehold.co/1600x900.png', hint: 'compost pile' }
];


export default function Home() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [user, setUser] = React.useState<User | null>(null);
  const [agriculturalSections, setAgriculturalSections] = React.useState<AgriculturalSection[]>([]);
  const [videoSections, setVideoSections] = React.useState<VideoSection[]>([]);
  
  const [isTopicDialogOpen, setTopicDialogOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<AgriculturalSection | undefined>(undefined);
  
  const [isVideoDialogOpen, setVideoDialogOpen] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState<VideoSection | undefined>(undefined);

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

  React.useEffect(() => {
      if (agriculturalSections.length > 0 || initialAgriculturalSections.length > 0) {
        localStorage.setItem('agriculturalSections', JSON.stringify(agriculturalSections));
      }
  }, [agriculturalSections]);

  React.useEffect(() => {
    if (videoSections.length > 0 || initialVideoSections.length > 0) {
      localStorage.setItem('videoSections', JSON.stringify(videoSections));
    }
  }, [videoSections]);

  const isAdmin = user?.role === 'admin';

  function handleAddOrUpdateTopic(data: TopicFormValues) {
    const iconName = data.iconName as IconName;
    const isValidIcon = Object.keys(iconComponents).includes(iconName);

    const topicData = {
        title: data.title,
        description: data.description,
        iconName: isValidIcon ? iconName : ('Sprout' as IconName),
        image: data.image,
        hint: data.title.toLowerCase().split(" ").slice(0,2).join(" "),
    };

    if (editingTopic) {
        const updatedSections = agriculturalSections.map(s => s.id === editingTopic.id ? { ...s, ...topicData, titleKey: 'custom' as TranslationKeys, descriptionKey: 'custom' as TranslationKeys } : s);
        setAgriculturalSections(updatedSections);
        toast({ title: t('editTopicSuccess') });
    } else {
        const newTopic: AgriculturalSection = {
            id: crypto.randomUUID(),
            titleKey: 'custom' as TranslationKeys,
            descriptionKey: 'custom' as TranslationKeys,
            ...topicData,
            subTopics: []
        };
        setAgriculturalSections(prev => [...prev, newTopic]);
        toast({ title: t('addTopicSuccess') });
    }
    setEditingTopic(undefined);
    setTopicDialogOpen(false);
  }

  function handleDeleteTopic(topicId: string) {
    setAgriculturalSections(prev => prev.filter(t => t.id !== topicId));
    toast({ variant: 'destructive', title: t('deleteTopicSuccess') });
  }

  function handleAddOrUpdateVideo(data: VideoFormValues) {
      const videoData = {
          title: data.title,
          duration: data.duration,
          image: data.image,
          hint: data.title.toLowerCase().split(" ").slice(0,2).join(" "),
      };

      if(editingVideo) {
          const updatedVideos = videoSections.map(v => v.id === editingVideo.id ? { ...v, ...videoData, titleKey: 'custom' as TranslationKeys, durationKey: 'custom' as TranslationKeys } : v);
          setVideoSections(updatedVideos);
          toast({ title: t('editVideoSuccess') });
      } else {
          const newVideo: VideoSection = {
              id: crypto.randomUUID(),
              titleKey: 'custom' as TranslationKeys,
              durationKey: 'custom' as TranslationKeys,
              ...videoData
          };
          setVideoSections(prev => [...prev, newVideo]);
          toast({ title: t('addVideoSuccess') });
      }
      setEditingVideo(undefined);
      setVideoDialogOpen(false);
  }

  function handleDeleteVideo(videoId: string) {
    setVideoSections(prev => prev.filter(v => v.id !== videoId));
    toast({ variant: 'destructive', title: t('deleteVideoSuccess') });
  }

  const handleEditTopic = (topic: AgriculturalSection) => {
    setEditingTopic(topic);
    setTopicDialogOpen(true);
  };
  
  const handleEditVideo = (video: VideoSection) => {
    setEditingVideo(video);
    setVideoDialogOpen(true);
  };


  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12 text-center">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Leaf className="h-5 w-5" />
            <span className="font-semibold">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>
        
        <Separator className="w-full" />
        
        {/* Agricultural Topics Section */}
        <section className="w-full text-start">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-3"><BookOpen /> {t('agriculturalTopics')}</h2>
                {isAdmin && (
                    <TopicDialog
                        isOpen={isTopicDialogOpen}
                        setIsOpen={setTopicDialogOpen}
                        onSubmit={handleAddOrUpdateTopic}
                        topic={editingTopic}
                        setEditingTopic={setEditingTopic}
                    />
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agriculturalSections.map(topic => {
                    const Icon = iconComponents[topic.iconName] || Sprout;
                    const title = topic.titleKey === 'custom' && topic.title ? topic.title : t(topic.titleKey);
                    const description = topic.descriptionKey === 'custom' && topic.description ? topic.description : t(topic.descriptionKey);

                    return (
                    <Card key={topic.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader>
                            <Image src={topic.image} alt={title} width={600} height={400} className="w-full h-40 object-cover rounded-t-lg" data-ai-hint={topic.hint} />
                            <CardTitle className="pt-4 flex items-center gap-3">
                                <Icon className="w-6 h-6 text-primary" />
                                <span>{title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <CardDescription>{description}</CardDescription>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                             <Button asChild variant="outline">
                                <Link href={`/topics/${topic.id}`}>
                                    {t('readMore')}
                                </Link>
                            </Button>
                            {isAdmin && (
                                <div className="flex gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => handleEditTopic(topic)} title={t('editTopic')}>
                                        <Edit className="w-5 h-5" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t('delete')}>
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('confirmDeleteWorkerDesc', {workerName: title})}</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteTopic(topic.id)}>{t('confirmDelete')}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                )})}
            </div>
        </section>

        <Separator className="w-full" />

        {/* Educational Videos Section */}
        <section className="w-full text-start">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-3"><PlayCircle /> {t('educationalVideos')}</h2>
                {isAdmin && (
                   <VideoDialog
                        isOpen={isVideoDialogOpen}
                        setIsOpen={setVideoDialogOpen}
                        onSubmit={handleAddOrUpdateVideo}
                        video={editingVideo}
                        setEditingVideo={setEditingVideo}
                   />
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videoSections.map(video => {
                    const title = video.titleKey === 'custom' && video.title ? video.title : t(video.titleKey);
                    const duration = video.durationKey === 'custom' && video.duration ? video.duration : t(video.durationKey);
                    return(
                    <Card key={video.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="p-0 relative">
                            <Image src={video.image} alt={title} width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={video.hint} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-4">
                                <CardTitle className="text-primary-foreground text-lg">{title}</CardTitle>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{duration}</div>
                        </CardHeader>
                        <CardContent className="p-4">
                           {isAdmin && (
                                <div className="flex justify-end gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => handleEditVideo(video)} title={t('editVideo')}>
                                        <Edit className="w-5 h-5" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title={t('delete')}>
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('confirmDeleteWorkerDesc', {workerName: title})}</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteVideo(video.id)}>{t('confirmDelete')}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )})}
            </div>
        </section>

        <footer className="text-center mt-16 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}
