// src/app/actions.ts
'use server';

import { generateWateringSchedule, WateringScheduleInput } from '@/ai/flows/generate-watering-schedule';

export async function getWateringSchedule(input: WateringScheduleInput) {
  try {
    const result = await generateWateringSchedule(input);
    if (!result) {
        return { success: false, error: 'Failed to generate schedule. The AI model did not return a valid response.' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to generate schedule. ${errorMessage}` };
  }
}
