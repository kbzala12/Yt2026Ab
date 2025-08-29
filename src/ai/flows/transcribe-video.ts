'use server';

/**
 * @fileOverview A video transcription AI agent.
 *
 * - transcribeVideo - A function that handles the video transcription process.
 * - TranscribeVideoInput - The input type for the transcribeVideo function.
 * - TranscribeVideoOutput - The return type for the transcribeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeVideoInputSchema = z.object({
  videoUrl: z.string().describe('The URL of the YouTube video to transcribe.'),
});
export type TranscribeVideoInput = z.infer<typeof TranscribeVideoInputSchema>;

const TranscribeVideoOutputSchema = z.object({
  transcript: z.string().describe('The transcript of the video.'),
});
export type TranscribeVideoOutput = z.infer<typeof TranscribeVideoOutputSchema>;

export async function transcribeVideo(input: TranscribeVideoInput): Promise<TranscribeVideoOutput> {
  return transcribeVideoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transcribeVideoPrompt',
  input: {schema: TranscribeVideoInputSchema},
  output: {schema: TranscribeVideoOutputSchema},
  prompt: `You are an expert video transcriber. Your task is to provide a precise and accurate transcription of the video content found at the provided URL.

Video URL: {{{videoUrl}}}
`,
});

const transcribeVideoFlow = ai.defineFlow(
  {
    name: 'transcribeVideoFlow',
    inputSchema: TranscribeVideoInputSchema,
    outputSchema: TranscribeVideoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
