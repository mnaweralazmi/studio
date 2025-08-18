
export interface SubTopic {
    id: string;
    titleKey: string;
    descriptionKey: string;
    image: string;
    hint?: string;
}
  
export interface AgriculturalSection {
    id: string;
    titleKey: 'custom' | string;
    title?: string;
    descriptionKey: 'custom' | string;
    description?: string;
    iconName: string;
    image: string;
    hint?: string;
    subTopics: SubTopic[];
}
  
export interface VideoSection {
    id: string;
    titleKey: 'custom' | string;
    title?: string;
    durationKey: 'custom' | string;
    duration?: string;
    image: string;
    hint?: string;
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
        { id: '1-3', titleKey: 'subTopicTraditionalIrrigation', descriptionKey: 'subTopicTraditionalIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'flood irrigation' },
        { id: '1-4', titleKey: 'subTopicModernIrrigation', descriptionKey: 'subTopicModernIrrigationDesc', image: 'https://placehold.co/600x400.png', hint: 'smart farming' },
      ],
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
        { id: '2-3', titleKey: 'subTopicPestPrevention', descriptionKey: 'subTopicPestPreventionDesc', image: 'https://placehold.co/600x400.png', hint: 'healthy plant' },
      ],
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
        { id: '3-2', titleKey: 'subTopicFruitingPruning', descriptionKey: 'subTopicFruitingPruningDesc', image: 'https://placehold.co/600x400.png', hint: 'fruit tree' },
        { id: '3-3', titleKey: 'subTopicRenewalPruning', descriptionKey: 'subTopicRenewalPruningDesc', image: 'https://placehold.co/600x400.png', hint: 'old branch' },
      ],
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
         { id: '4-2', titleKey: 'subTopicSoilImprovement', descriptionKey: 'subTopicSoilImprovementDesc', image: 'https://placehold.co/600x400.png', hint: 'adding compost' },
         { id: '4-3', titleKey: 'subTopicFertilizationTypes', descriptionKey: 'subTopicFertilizationTypesDesc', image: 'https://placehold.co/600x400.png', hint: 'fertilizer bags' },
      ],
    },
     {
      id: '5',
      titleKey: "topicHarvesting",
      descriptionKey: "topicHarvestingDesc",
      iconName: 'Carrot',
      image: 'https://placehold.co/600x400.png',
      hint: 'harvest basket',
      subTopics: [
        { id: '5-1', titleKey: 'subTopicHarvestTiming', descriptionKey: 'subTopicHarvestTimingDesc', image: 'https://placehold.co/600x400.png', hint: 'ripe tomato' },
        { id: '5-2', titleKey: 'subTopicHarvestingMethods', descriptionKey: 'subTopicHarvestingMethodsDesc', image: 'https://placehold.co/600x400.png', hint: 'harvesting wheat' },
        { id: '5-3', titleKey: 'subTopicPostHarvest', descriptionKey: 'subTopicPostHarvestDesc', image: 'https://placehold.co/600x400.png', hint: 'vegetable crate' },
      ],
    },
];
  
export const initialVideoSections: VideoSection[] = [
    { id: '1', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://placehold.co/600x400.png', hint: 'gardening tools' },
    { id: '2', titleKey: 'videoGrowingTomatoes', durationKey: 'videoDuration15', image: 'https://placehold.co/600x400.png', hint: 'tomato plant' },
    { id: '3', titleKey: 'videoComposting', durationKey: 'videoDuration20', image: 'https://placehold.co/600x400.png', hint: 'compost bin' },
];
