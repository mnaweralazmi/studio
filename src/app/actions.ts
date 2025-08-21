// src/app/actions.ts
'use server';

import { generateWateringSchedule, WateringScheduleInput } from '@/ai/flows/generate-watering-schedule';
import { generatePlantingPlan, PlantingPlanInput } from '@/ai/flows/generate-planting-plan';

export async function getWateringSchedule(input: WateringScheduleInput) {
  try {
    const result = await generateWateringSchedule(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate schedule. Please try again.' };
  }
}

export async function getPlantingPlan(input: PlantingPlanInput) {
  try {
    const result = await generatePlantingPlan(input);
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate plan. Please try again.' };
  }
}
