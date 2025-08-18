
"use client";

import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import { Leaf, PlusCircle } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import Link from 'next/link';
import type arTranslations from '@/locales/ar.json';
import { Button } from '@/components/ui/button';
import { TopicDialog, TopicFormValues } from '@/components/topic-dialog';
import { VideoDialog, VideoFormValues } from '@/components/video-dialog';
import { iconComponents, IconName } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

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

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-12 text-center">
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

        <div className="w-full space-y-8 max-w-2xl">
          <Separator />
            <div className="flex justify-between items-center">
                <Link href="/topics/1" className="text-2xl font-bold hover:text-primary transition-colors">
                  {t('agriculturalTopics')}
                </Link>
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
          <Separator />
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('educationalVideos')}</h2>
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
          <Separator />
        </div>

        <footer className="text-center mt-16 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}

    