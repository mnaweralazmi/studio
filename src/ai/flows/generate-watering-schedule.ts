// src/ai/flows/generate-watering-schedule.ts
'use server';

/**
 * @fileOverview Generates a tailored watering schedule based on plant type and season.
 *
 * - generateWateringSchedule - A function that generates watering reminders.
 * - WateringScheduleInput - The input type for the generateWateringSchedule function.
 * - WateringScheduleOutput - The return type for the generateWateringSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WateringScheduleInputSchema = z.object({
  plantType: z.string().describe('The type of plant (e.g., succulent, fern, orchid).'),
  season: z.string().describe('The current season (e.g., Spring, Summer, Autumn, Winter).'),
  location: z.string().describe('The location of the plant (e.g., indoor, outdoor, greenhouse).'),
});
export type WateringScheduleInput = z.infer<typeof WateringScheduleInputSchema>;

const WateringScheduleOutputSchema = z.object({
  wateringSchedule: z
    .string()
    .describe(
      'A tailored watering schedule for the specified plant, including frequency and amount, considering the current season.'
    ),
});
export type WateringScheduleOutput = z.infer<typeof WateringScheduleOutputSchema>;

export async function generateWateringSchedule(
  input: WateringScheduleInput
): Promise<WateringScheduleOutput> {
  return generateWateringScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'wateringSchedulePrompt',
  input: {schema: WateringScheduleInputSchema},
  output: {schema: WateringScheduleOutputSchema},
  prompt: `You are an expert in plant care, specializing in creating watering schedules.

  Based on the plant type, current season, and plant location, generate a watering schedule that includes the frequency and amount of water needed.

  Plant Type: {{{plantType}}}
  Season: {{{season}}}
  Location: {{{location}}}

  Consider how the season affects watering needs (e.g., increased frequency in summer, decreased in winter).
  Provide specific recommendations for the watering schedule, including how often to water and the approximate amount of water to use each time.
`,
});

const generateWateringScheduleFlow = ai.defineFlow(
  {
    name: 'generateWateringScheduleFlow',
    inputSchema: WateringScheduleInputSchema,
    outputSchema: WateringScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate schedule from prompt.");
    }
    return output;
  }
);
