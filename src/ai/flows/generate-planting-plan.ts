'use server';

/**
 * @fileOverview Generates a custom planting plan based on user inputs.
 *
 * - generatePlantingPlan - A function that generates a detailed agricultural plan.
 * - PlantingPlanInput - The input type for the generatePlantingPlan function.
 * - PlantingPlanOutput - The return type for the generatePlantingPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantingPlanInputSchema = z.object({
  landArea: z.coerce.number().describe('The total land area available for planting in square meters.'),
  budget: z.coerce.number().describe('The total budget available for the planting project.'),
  plantTypes: z.string().describe('A description or list of desired plants or crops to grow.'),
});
export type PlantingPlanInput = z.infer<typeof PlantingPlanInputSchema>;

const PlantingPlanOutputSchema = z.object({
  plantingSchedule: z.string().describe('A detailed timeline and schedule for planting activities, from soil preparation to planting the seeds/seedlings.'),
  costEstimation: z.string().describe('A breakdown of the estimated costs, including seeds, soil, fertilizers, and other potential expenses.'),
  cropForecast: z.string().describe('A forecast of the expected crop yield and potential revenue, including estimated time to harvest.'),
});
export type PlantingPlanOutput = z.infer<typeof PlantingPlanOutputSchema>;

export async function generatePlantingPlan(
  input: PlantingPlanInput
): Promise<PlantingPlanOutput> {
  return generatePlantingPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'plantingPlanPrompt',
  input: {schema: PlantingPlanInputSchema},
  output: {schema: PlantingPlanOutputSchema},
  prompt: `You are an expert agricultural planner. Your task is to create a detailed, custom planting plan based on the user's requirements.

User's Requirements:
- Land Area: {{{landArea}}} square meters
- Budget: {{{budget}}} KWD
- Desired Plants: {{{plantTypes}}}

Based on these inputs, generate a comprehensive plan that includes the following sections:

1.  **Planting Schedule:** Provide a clear, step-by-step timeline. Start from soil preparation, to planting, to care. Be specific about timing (e.g., "Week 1-2", "Month 3").
2.  **Cost Estimation:** Break down the estimated costs. Be realistic and cover major expenses like seeds, soil amendments, fertilizers, tools, etc., ensuring it aligns with the user's budget. Provide amounts in KWD.
3.  **Crop Forecast:** Give an estimate of the potential harvest. Include expected yield (e.g., in kg) and an estimated time to first harvest.

Present the output in a clear, well-structured format. Use Markdown for formatting (bolding, lists).`,
});

const generatePlantingPlanFlow = ai.defineFlow(
  {
    name: 'generatePlantingPlanFlow',
    inputSchema: PlantingPlanInputSchema,
    outputSchema: PlantingPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate a plan from the prompt.");
    }
    return output;
  }
);
