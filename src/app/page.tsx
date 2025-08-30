
"use client";

import * as React from 'react';
import * as Lucide from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { useTopics } from '@/context/topics-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayCircle, BookOpen, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { TopicDialog, TopicFormValues } from '@/components/topic-dialog';
import type { AgriculturalSection } from '@/lib/topics-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const getIcon = (name: string): React.ElementType => {
    const Icon = (Lucide as unknown as Record<string, React.ElementType>)[name];
    return Icon || Lucide.Leaf;
};

export default function Home() {
  const { t, language } = useLanguage();
  const { topics, setTopics } = useTopics();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<AgriculturalSection | undefined>(undefined);

  const isAdmin = user?.role === 'admin';

  const handleDialogOpen = (topic?: AgriculturalSection) => {
      setEditingTopic(topic);
      setIsDialogOpen(true);
  }

  const handleSubmit = (data: TopicFormValues) => {
    setTopics(prevTopics => {
        if (editingTopic) {
            // Update existing topic
            toast({ title: t('editTopicSuccess') });
            return prevTopics.map(topic => 
                topic.id === editingTopic.id ? { 
                    ...topic, 
                    titleKey: 'custom', 
                    title: data.title,
                    descriptionKey: 'custom',
                    description: data.description,
                    image: data.image,
                    iconName: data.iconName,
                    hint: data.title.toLowerCase().split(' ').slice(0, 2).join(' '),
                } : topic
            );
        } else {
            // Add new topic
            const newTopic: AgriculturalSection = {
                id: crypto.randomUUID(),
                titleKey: 'custom',
                title: data.title,
                descriptionKey: 'custom',
                description: data.description,
                iconName: data.iconName,
                image: data.image,
                hint: data.title.toLowerCase().split(' ').slice(0, 2).join(' '),
                subTopics: [],
                videos: []
            };
            toast({ title: t('addTopicSuccess') });
            return [...prevTopics, newTopic];
        }
    });
    setIsDialogOpen(false);
    setEditingTopic(undefined);
  };
  
  const handleDelete = (topicId: string) => {
      setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicId));
      toast({ variant: 'destructive', title: t('deleteTopicSuccess') });
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
            <Lucide.Leaf className="h-4 w-4" />
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
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">{t('agriculturalTopics')}</h2>
              {isAdmin && <TopicDialog isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} onSubmit={handleSubmit} topic={editingTopic} setEditingTopic={setEditingTopic} />}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topics.map((topic) => {
                    const title = topic.titleKey === 'custom' ? topic.title : t(topic.titleKey as any);
                    const description = topic.descriptionKey === 'custom' ? topic.description : t(topic.descriptionKey as any);
                    const video = topic.videos && topic.videos.length > 0 ? topic.videos[0] : null;
                    return (
                        <Card key={topic.id} className="group overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col relative">
                            <div className="relative w-full h-40">
                                <Image 
                                    src={topic.image} 
                                    alt={title!} 
                                    fill 
                                    style={{objectFit: 'cover'}}
                                    data-ai-hint={topic.hint}
                                />
                            </div>
                            <CardContent className="p-4 flex flex-col flex-1">
                                <h3 className="text-lg font-bold mb-2">{title}</h3>
                                <p className="text-muted-foreground text-sm flex-1">{description}</p>
                                <div className="flex flex-col gap-2 mt-4">
                                    <Button asChild size="sm">
                                        <Link href={`/topics/${topic.id}`}>
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            {t('readMore')}
                                        </Link>
                                    </Button>
                                    {video && (
                                        <Button asChild variant="secondary" size="sm">
                                            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                {t('watchVideo')}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                             {isAdmin && (
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="secondary" onClick={() => handleDialogOpen(topic)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                                                <AlertDialogDescription>{t('confirmDeleteTopicDesc', {topicName: title ?? ""})}</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(topic.id)}>{t('confirmDelete')}</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )}
                        </Card>
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
