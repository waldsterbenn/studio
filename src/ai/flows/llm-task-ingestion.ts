// src/ai/flows/llm-task-ingestion.ts
'use server';

/**
 * @fileOverview Implements LLM-powered task ingestion from natural language text.
 *
 * - ingestTasksFlow - A Genkit flow that takes natural language text and returns a structured list of tasks.
 * - LlmTaskIngestionInput - The input type for the ingestTasks function.
 * - LlmTaskIngestionOutput - The output type for the ingestTasks function.
 */

import {ai} from '@/ai/genkit';
import {Task} from '@/services/external-task-ingestion';
import {z} from 'genkit';

const LlmTaskIngestionInputSchema = z.object({
  text: z.string().describe('The natural language text describing the problem or list of tasks.'),
});
export type LlmTaskIngestionInput = z.infer<typeof LlmTaskIngestionInputSchema>;

const LlmTaskIngestionOutputSchema = z.array(z.object({
  title: z.string().describe('The title of the task.'),
  subtasks: z.array(z.object({
    title: z.string().describe('The title of the subtask.'),
  })).optional(),
}));
export type LlmTaskIngestionOutput = z.infer<typeof LlmTaskIngestionOutputSchema>;

export async function ingestTasks(input: LlmTaskIngestionInput): Promise<LlmTaskIngestionOutput> {
  return ingestTasksFlow(input);
}

const ingestTasksPrompt = ai.definePrompt({
  name: 'ingestTasksPrompt',
  input: {schema: LlmTaskIngestionInputSchema},
  output: {schema: LlmTaskIngestionOutputSchema},
  prompt: `You are a task management expert. Your job is to take a user's problem or list of tasks described in natural language, and create a basic structured list.

  Here is the user's input:
  {{text}}

  Return a JSON array of tasks. Each task should have a title. Tasks can optionally have subtasks, which should be an array of tasks with titles.
  `,
});

const ingestTasksFlow = ai.defineFlow(
  {
    name: 'ingestTasksFlow',
    inputSchema: LlmTaskIngestionInputSchema,
    outputSchema: LlmTaskIngestionOutputSchema,
  },
  async input => {
    const {output} = await ingestTasksPrompt(input);
    return output!;
  }
);
