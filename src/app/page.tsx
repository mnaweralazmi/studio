
"use client";

import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import { Leaf, PlusCircle, Edit, Trash2, PlayCircle, BookOpen, Droplets, Bug, Scissors, Sprout } from 'lucide-react';
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

const quickAccessTopics = [
    { id: '1', title: 'ري', icon: Droplets, href: '/topics/1' },
    { id: '2', title: 'آفات', icon: Bug, href: '/topics/2' },
    { id: '3', title: 'بذور', icon: Sprout, href: '/topics/1' },
    { id: '4', title: 'تقليم', icon: Scissors, href: '/topics/3' },
]


export default function Home() {
  const { t } = useLanguage();
  const [agriculturalSections, setAgriculturalSections] = React.useState<AgriculturalSection[]>([]);
  const [videoSections, setVideoSections] = React.useState<VideoSection[]>([]);

  React.useEffect(() => {
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-2xl">
            {quickAccessTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                     <Link href={topic.href} key={topic.id} className="group flex flex-col items-center gap-2 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary/20 group-hover:scale-110">
                            <Icon className="h-8 w-8" />
                        </div>
                        <p className="font-semibold text-sm text-foreground">{topic.title}</p>
                    </Link>
                )
            })}
        </div>

        <footer className="text-center mt-16 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} {t('footerText')}</p>
        </footer>
      </div>
    </main>
  );
}
