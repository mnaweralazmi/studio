// src/ai/flows/generate-watering-schedule.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/* =========================
   Schemas
   ========================= */

export const WateringScheduleInputSchema = z.object({
  plantType: z.string().describe('Type of plant (e.g., succulent, fern, orchid).'),
  season: z.string().describe('Season (e.g., Spring, Summer, Autumn, Winter).'),
  location: z.string().describe('Plant location (e.g., indoor, outdoor, greenhouse).'),
});
export type WateringScheduleInput = z.infer<typeof WateringScheduleInputSchema>;

export const WateringScheduleOutputSchema = z.object({
  wateringSchedule: z
    .string()
    .describe('Tailored watering schedule including frequency and amount.'),
});
export type WateringScheduleOutput = z.infer<typeof WateringScheduleOutputSchema>;

/* =========================
   Prompt
   ========================= */

const prompt = ai.definePrompt({
  name: 'wateringSchedulePrompt',
  input: { schema: WateringScheduleInputSchema },
  output: { schema: WateringScheduleOutputSchema },
  prompt: `
You are a plant care expert. Based on the plant type, season, and location, generate a watering schedule.

Plant Type: {{{plantType}}}
Season: {{{season}}}
Location: {{{location}}}

Return a clear schedule including frequency and approximate amount of water.
`,
});

/* =========================
   Flow
   ========================= */

export const generateWateringScheduleFlow = ai.defineFlow(
  {
    name: 'generateWateringScheduleFlow',
    inputSchema: WateringScheduleInputSchema,
    outputSchema: WateringScheduleOutputSchema,
  },
  async (input: WateringScheduleInput): Promise<WateringScheduleOutput> => {
    const { output } = await prompt(input);
    return { wateringSchedule: String(output ?? '') };
  }
);
