
'use server';

/**
 * @fileOverview Summarizes a video given a transcription and desired summary size.
 *
 * - summarizeVideo - A function that summarizes the video.
 * - SummarizeVideoInput - The input type for the summarizeVideo function.
 * - SummarizeVideoOutput - The return type for the summarizeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarySizeSchema = z.enum(['small', 'medium', 'large']);
export type SummarySize = z.infer<typeof SummarySizeSchema>;

const SummarizeVideoInputSchema = z.object({
  transcript: z.string().describe('The transcription of the video.'),
  summarySize: SummarySizeSchema.describe('The desired size of the summary.'),
});
export type SummarizeVideoInput = z.infer<typeof SummarizeVideoInputSchema>;

const SummarizeVideoOutputSchema = z.object({
  summary: z.string().describe('The summary of the video.'),
});
export type SummarizeVideoOutput = z.infer<typeof SummarizeVideoOutputSchema>;

export async function summarizeVideo(input: SummarizeVideoInput): Promise<SummarizeVideoOutput> {
  return summarizeVideoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeVideoPrompt',
  input: {schema: SummarizeVideoInputSchema},
  output: {schema: SummarizeVideoOutputSchema},
  prompt: `You are an expert video summarizer. You will be given a transcript of a video and you will generate a summary of the video.

The user will specify the desired size of the summary. The summary size options are small, medium, and large. A small summary should be a single paragraph. A medium summary should be a few paragraphs. A large summary should be a detailed summary of the video.

Transcript: {{{transcript}}}

Summary size: {{{summarySize}}}
`,
});

const summarizeVideoFlow = ai.defineFlow(
  {
    name: 'summarizeVideoFlow',
    inputSchema: SummarizeVideoInputSchema,
    outputSchema: SummarizeVideoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
