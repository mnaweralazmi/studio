
export interface VideoSection {
  id: string;
  titleKey: string;
  title?: string;
  durationKey: string;
  duration?: string;
  image: string;
  videoUrl: string;
  hint?: string;
}

export interface SubTopic {
    id: string;
    titleKey: string;
    title?: string;
    descriptionKey: string;
    description?: string;
    image: string;
    hint?: string;
}
  
export interface AgriculturalSection {
    id: string;
    titleKey: string;
    title?: string;
    descriptionKey: string;
    description?: string;
    iconName: string;
    image: string;
    hint?: string;
    subTopics: SubTopic[];
    videos: VideoSection[];
    ownerId?: string;
}
