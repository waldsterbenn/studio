'use server';

/**
 * @fileOverview Suggests a first step for a given task using an LLM.
 *
 * - suggestFirstStep - A function that suggests a first step for a task.
 * - SuggestFirstStepInput - The input type for the suggestFirstStep function.
 * - SuggestFirstStepOutput - The return type for the suggestFirstStep function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFirstStepInputSchema = z.object({
  task: z.string().describe('The task for which to suggest a first step.'),
});
export type SuggestFirstStepInput = z.infer<typeof SuggestFirstStepInputSchema>;

const SuggestFirstStepOutputSchema = z.object({
  firstStep: z.string().describe('The suggested first step for the task.'),
});
export type SuggestFirstStepOutput = z.infer<typeof SuggestFirstStepOutputSchema>;

export async function suggestFirstStep(input: SuggestFirstStepInput): Promise<SuggestFirstStepOutput> {
  return suggestFirstStepFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFirstStepPrompt',
  input: {schema: SuggestFirstStepInputSchema},
  output: {schema: SuggestFirstStepOutputSchema},
  prompt: `Given the task: {{{task}}}, suggest a very small first action I can take to get started easily.`,
});

const suggestFirstStepFlow = ai.defineFlow(
  {
    name: 'suggestFirstStepFlow',
    inputSchema: SuggestFirstStepInputSchema,
    outputSchema: SuggestFirstStepOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
