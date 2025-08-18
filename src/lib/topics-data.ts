
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
}
  
export const initialAgriculturalSections: AgriculturalSection[] = [
    {
      id: '1',
      titleKey: "topicIrrigation",
      descriptionKey: "topicIrrigationDesc",
      iconName: 'Droplets',
      image: 'https://placehold.co/600x400.png',
      hint: 'watering plants',
      subTopics: [
        { id: '1-1', titleKey: 'subTopicDripIrrigation', descriptionKey: 'subTopicDripIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'drip irrigation' },
        { id: '1-2', titleKey: 'subTopicSprinklerIrrigation', descriptionKey: 'subTopicSprinklerIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'sprinkler irrigation' },
      ],
      videos: [
        { id: 'v-1', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://placehold.co/600x400.png', videoUrl: '#', hint: 'gardening basics' }
      ]
    },
    {
      id: '2',
      titleKey: "topicPests",
      descriptionKey: "topicPestsDesc",
      iconName: 'Bug',
      image: 'https://placehold.co/600x400.png',
      hint: 'insect pest',
      subTopics: [
        { id: '2-1', titleKey: 'subTopicNaturalPestControl', descriptionKey: 'subTopicNaturalPestControlDesc', image: 'https://placehold.co/600x400.png', hint: 'ladybug pests' },
        { id: '2-2', titleKey: 'subTopicChemicalPesticides', descriptionKey: 'subTopicChemicalPesticidesDesc', image: 'https://placehold.co/600x400.png', hint: 'spraying pesticides' },
      ],
      videos: []
    },
    {
      id: '3',
      titleKey: "topicPruning",
      descriptionKey: "topicPruningDesc",
      iconName: 'Scissors',
      image: 'https://placehold.co/600x400.png',
      hint: 'pruning shears',
      subTopics: [
        { id: '3-1', titleKey: 'subTopicFormativePruning', descriptionKey: 'subTopicFormativePruningDesc', image: 'https://placehold.co/600x400.png', hint: 'young tree' },
      ],
      videos: []
    },
    {
      id: '4',
      titleKey: "topicSoil",
      descriptionKey: "topicSoilDesc",
      iconName: 'Sprout',
      image: 'https://placehold.co/600x400.png',
      hint: 'rich soil',
      subTopics: [
         { id: '4-1', titleKey: 'subTopicSoilAnalysis', descriptionKey: 'subTopicSoilAnalysisDesc', image: 'https://placehold.co/600x400.png', hint: 'soil test' },
      ],
      videos: []
    },
];
