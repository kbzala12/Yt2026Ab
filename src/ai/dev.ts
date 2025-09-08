import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-video.ts';
import '@/ai/flows/transcribe-video.ts';
import '@/ai/flows/get-video-details.ts';
