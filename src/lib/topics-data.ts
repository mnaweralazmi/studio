
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
  
export const initialAgriculturalSections: AgriculturalSection[] = [
    {
      id: '1',
      titleKey: "topicIrrigation",
      descriptionKey: "topicIrrigationDesc",
      iconName: 'Droplets',
      image: 'https://placehold.co/400x200.png',
      hint: 'watering plants',
      subTopics: [
        { id: '1-1', titleKey: 'subTopicDripIrrigation', descriptionKey: 'subTopicDripIrrigationDesc', image: 'https://placehold.co/400x200.png', hint: 'drip irrigation' },
        { id: '1-2', titleKey: 'subTopicSprinklerIrrigation', descriptionKey: 'subTopicSprinklerIrrigationDesc', image: 'https://placehold.co/400x200.png', hint: 'sprinkler irrigation' },
      ],
      videos: [
        { id: 'v-1', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://placehold.co/400x200.png', videoUrl: 'https://www.youtube.com/watch?v=example1', hint: 'gardening basics' }
      ]
    },
    {
      id: '5',
      titleKey: "topicFertilization",
      descriptionKey: "topicFertilizationDesc",
      iconName: 'FlaskConical',
      image: 'https://placehold.co/400x200.png',
      hint: 'fertilizer',
      subTopics: [
         { id: '5-1', titleKey: 'subTopicFertilizationTypes', descriptionKey: 'subTopicFertilizationTypesDesc', image: 'https://placehold.co/400x200.png', hint: 'fertilizer types' },
      ],
      videos: [
        { id: 'v-2', titleKey: 'videoComposting', durationKey: 'videoDuration20', image: 'https://placehold.co/400x200.png', videoUrl: 'https://www.youtube.com/watch?v=example2', hint: 'compost bin' }
      ]
    },
    {
      id: '2',
      titleKey: "topicPests",
      descriptionKey: "topicPestsDesc",
      iconName: 'Bug',
      image: 'https://placehold.co/400x200.png',
      hint: 'insect pest',
      subTopics: [
        { id: '2-1', titleKey: 'subTopicNaturalPestControl', descriptionKey: 'subTopicNaturalPestControlDesc', image: 'https://placehold.co/400x200.png', hint: 'ladybug pests' },
        { id: '2-2', titleKey: 'subTopicChemicalPesticides', descriptionKey: 'subTopicChemicalPesticidesDesc', image: 'https://placehold.co/400x200.png', hint: 'spraying pesticides' },
      ],
       videos: [
        { id: 'v-5', titleKey: 'videoPestControl', durationKey: 'videoDuration18', image: 'https://placehold.co/400x200.png', videoUrl: 'https://www.youtube.com/watch?v=example5', hint: 'pest control' }
      ]
    },
    {
      id: '3',
      titleKey: "topicPruning",
      descriptionKey: "topicPruningDesc",
      iconName: 'Scissors',
      image: 'https://placehold.co/400x200.png',
      hint: 'pruning shears',
      subTopics: [
        { id: '3-1', titleKey: 'subTopicFormativePruning', descriptionKey: 'subTopicFormativePruningDesc', image: 'https://placehold.co/400x200.png', hint: 'young tree' },
      ],
      videos: [
        { id: 'v-3', titleKey: 'videoGrowingTomatoes', durationKey: 'videoDuration15', image: 'https://placehold.co/400x200.png', videoUrl: 'https://www.youtube.com/watch?v=example3', hint: 'tomato plant' }
      ]
    },
    {
      id: '4',
      titleKey: "topicSoil",
      descriptionKey: "topicSoilDesc",
      iconName: 'Sprout',
      image: 'https://placehold.co/400x200.png',
      hint: 'rich soil',
      subTopics: [
         { id: '4-1', titleKey: 'subTopicSoilAnalysis', descriptionKey: 'subTopicSoilAnalysisDesc', image: 'https://placehold.co/400x200.png', hint: 'soil test' },
      ],
       videos: [
        { id: 'v-4', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://placehold.co/400x200.png', videoUrl: 'https://www.youtube.com/watch?v=example4', hint: 'gardening tools' }
      ]
    },
    {
      id: '8',
      titleKey: "topicSeeds",
      descriptionKey: "topicSeedsDesc",
      iconName: 'Sprout',
      image: 'https://placehold.co/400x200.png',
      hint: 'seeds planting',
      subTopics: [],
      videos: []
    }
];
