import { config } from 'dotenv';
config();

import '@/ai/flows/llm-task-ingestion.ts';
import '@/ai/flows/first-step-suggestion.ts';