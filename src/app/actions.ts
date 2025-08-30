// src/app/actions.ts
'use server';

import {
  generateWateringScheduleFlow,
  WateringScheduleInput,
  WateringScheduleOutput,
} from '@/ai/flows/generate-watering-schedule';

type ActionResult =
  | { success: true; data: WateringScheduleOutput }
  | { success: false; error: string };

export async function getWateringSchedule(input: WateringScheduleInput): Promise<ActionResult> {
  try {
    const result = await generateWateringScheduleFlow(input);

    if (!result?.wateringSchedule) {
      return {
        success: false,
        error: 'Failed to generate schedule. The AI model returned an empty response.',
      };
    }

    return { success: true, data: result };
  } catch (err: unknown) {
    console.error('[getWateringSchedule] Error:', err);
    const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
    return { success: false, error: `AI Error: ${msg}` };
  }
}
