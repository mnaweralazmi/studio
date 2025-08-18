
"use client";

import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import { Leaf, PlusCircle, Trash2, Edit, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import type arTranslations from '@/locales/ar.json';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TopicDialog, TopicFormValues } from '@/components/topic-dialog';
import { VideoDialog, VideoFormValues } from '@/components/video-dialog';
import { iconComponents, IconName } from '@/components/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from '@/lib/utils';


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
    },
    { 
        id: '4', 
        titleKey: 'topicSoil', 
        iconName: 'Sprout', 
        descriptionKey: 'topicSoilDesc', 
        image: 'https://placehold.co/600x400.png', 
        hint: 'soil fertilizer',
        subTopics: [
            { id: 'analysis', titleKey: 'subTopicSoilAnalysis', descriptionKey: 'subTopicSoilAnalysisDesc', image: 'https://placehold.co/600x400.png', hint: 'soil testing kit' },
            { id: 'improvement', titleKey: 'subTopicSoilImprovement', descriptionKey: 'subTopicSoilImprovementDesc', image: 'https://placehold.co/600x400.png', hint: 'adding compost' },
            { id: 'fertilization-types', titleKey: 'subTopicFertilizationTypes', descriptionKey: 'subTopicFertilizationTypesDesc', image: 'https://placehold.co/600x400.png', hint: 'fertilizer bags' }
        ]
    },
    { 
        id: '5', 
        titleKey: 'topicHarvesting', 
        iconName: 'Wheat', 
        descriptionKey: 'topicHarvestingDesc', 
        image: 'https://placehold.co/600x400.png', 
        hint: 'harvest basket',
        subTopics: [
            { id: 'timing', titleKey: 'subTopicHarvestTiming', descriptionKey: 'subTopicHarvestTimingDesc', image: 'https://placehold.co/600x400.png', hint: 'ripe tomatoes' },
            { id: 'methods', titleKey: 'subTopicHarvestingMethods', descriptionKey: 'subTopicHarvestingMethodsDesc', image: 'https://placehold.co/600x400.png', hint: 'harvesting vegetables' },
            { id: 'post-harvest', titleKey: 'subTopicPostHarvest', descriptionKey: 'subTopicPostHarvestDesc', image: 'https://placehold.co/600x400.png', hint: 'vegetable storage' }
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
      if (agriculturalSections.length > 0) {
        localStorage.setItem('agriculturalSections', JSON.stringify(agriculturalSections));
      }
  }, [agriculturalSections]);

  React.useEffect(() => {
    if (videoSections.length > 0) {
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
        // Update existing topic
        const updatedSections = agriculturalSections.map(s => s.id === editingTopic.id ? { ...s, ...topicData, titleKey: 'custom' as TranslationKeys, descriptionKey: 'custom' as TranslationKeys } : s);
        setAgriculturalSections(updatedSections);
        toast({ title: t('editTopicSuccess') });
    } else {
        // Add new topic
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

  function deleteTopic(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAgriculturalSections(prev => prev.filter(s => s.id !== id));
    toast({ variant: "destructive", title: t('deleteTopicSuccess') });
  }

  function deleteVideo(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setVideoSections(prev => prev.filter(v => v.id !== id));
    toast({ variant: "destructive", title: t('deleteVideoSuccess') });
  }

  function openEditTopicDialog(topic: AgriculturalSection, e: React.MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      setEditingTopic(topic);
      setTopicDialogOpen(true);
  }

  function openEditVideoDialog(video: VideoSection, e: React.MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      setEditingVideo(video);
      setVideoDialogOpen(true);
  }
  
  if (agriculturalSections.length === 0) {
      return null;
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-16">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary">{t('kuwaitiFarmer')}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            {t('homeHeaderTitle')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            {t('homeHeaderSubtitle')}
          </p>
        </header>

        <section className="w-full">
            <div className="flex justify-between items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold">{t('agriculturalTopics')}</h2>
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

             <Tabs defaultValue={agriculturalSections[0].id} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto p-1.5">
                    {agriculturalSections.map(section => {
                       const Icon = iconComponents[section.iconName] || iconComponents['Sprout'];
                       const title = section.titleKey === 'custom' ? section.title : t(section.titleKey);
                       return (
                         <TabsTrigger key={section.id} value={section.id} className="flex flex-col items-center gap-2 h-20 text-sm data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary">
                            <Icon className="h-6 w-6" />
                            <span>{title}</span>
                         </TabsTrigger>
                       )
                    })}
                </TabsList>
                {agriculturalSections.map(section => {
                    const Icon = iconComponents[section.iconName] || iconComponents['Sprout'];
                    const title = section.titleKey === 'custom' ? section.title : t(section.titleKey);
                    const description = section.descriptionKey === 'custom' ? section.description : t(section.descriptionKey);

                    return (
                        <TabsContent key={section.id} value={section.id} className="mt-6">
                            <Card className="border-none shadow-none">
                                <CardContent className="p-2">
                                     <Carousel
                                        opts={{
                                            align: "start",
                                            loop: true,
                                            direction: language === 'ar' ? 'rtl' : 'ltr',
                                        }}
                                        className="w-full"
                                    >
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <div className="flex items-center gap-4">
                                                <Icon className="h-8 w-8 text-primary" />
                                                <div>
                                                    <h3 className="text-2xl font-bold">{title}</h3>
                                                    <p className="text-muted-foreground">{description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CarouselPrevious />
                                                <CarouselNext />
                                            </div>
                                        </div>
                                        <CarouselContent>
                                            {section.subTopics.map((subTopic) => {
                                                const subTopicTitle = t(subTopic.titleKey);
                                                const subTopicDescription = t(subTopic.descriptionKey);
                                                return (
                                                <CarouselItem key={subTopic.id} className="md:basis-1/2 lg:basis-1/3">
                                                    <div className="p-1">
                                                    <Link href={`/topics/${section.id}/${subTopic.id}`} className="group">
                                                        <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                                                            <CardHeader className="p-0">
                                                                <Image src={subTopic.image} alt={subTopicTitle} width={600} height={400} className="w-full h-40 object-cover" data-ai-hint={subTopic.hint} />
                                                            </CardHeader>
                                                            <CardContent className="p-6 flex-1 flex flex-col">
                                                                <CardTitle className="mb-2 text-lg">
                                                                    {subTopicTitle}
                                                                </CardTitle>
                                                                <p className="text-muted-foreground text-sm flex-1">{subTopicDescription.substring(0, 120)}...</p>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                    </div>
                                                </CarouselItem>
                                            )})}
                                             {section.subTopics.length === 0 && (
                                                <div className="w-full text-center py-12 text-muted-foreground">
                                                   لا توجد مواضيع فرعية متاحة حاليًا.
                                                </div>
                                            )}
                                        </CarouselContent>
                                    </Carousel>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )
                })}
            </Tabs>
        </section>

        <section className="w-full">
             <div className="flex justify-between items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-center">{t('educationalVideos')}</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {videoSections.map((video) => {
                const title = video.titleKey === 'custom' ? video.title : t(video.titleKey);
                const duration = video.durationKey === 'custom' ? video.duration : t(video.durationKey);
                return (
                <Card key={video.id} className="overflow-hidden group cursor-pointer shadow-lg relative">
                    <div className="relative">
                        <Image src={video.image} alt={title!} width={1600} height={900} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={video.hint} />
                    </div>
                    <CardContent className="p-4 bg-card">
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="text-sm text-muted-foreground">{duration}</p>
                    </CardContent>
                    {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary" size="icon" onClick={(e) => openEditVideoDialog(video, e)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={(e) => deleteVideo(video.id, e)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
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

    

    