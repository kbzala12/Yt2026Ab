
'use server';

/**
 * @fileOverview Gets details for a YouTube video.
 *
 * - getVideoDetails - A function that gets the video details.
 * - GetVideoDetailsInput - The input type for the getVideoDetails function.
 * - GetVideoDetailsOutput - The return type for the getVideoDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetVideoDetailsInputSchema = z.object({
  videoUrl: z.string().describe('The URL of the YouTube video.'),
  title: z.string().describe('The title of the video provided by the user.')
});
export type GetVideoDetailsInput = z.infer<typeof GetVideoDetailsInputSchema>;

const GetVideoDetailsOutputSchema = z.object({
  channel: z.string().describe('The name of the YouTube channel that uploaded the video.'),
});
export type GetVideoDetailsOutput = z.infer<typeof GetVideoDetailsOutputSchema>;

export async function getVideoDetails(input: GetVideoDetailsInput): Promise<GetVideoDetailsOutput> {
  return getVideoDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getVideoDetailsPrompt',
  input: {schema: GetVideoDetailsInputSchema},
  output: {schema: GetVideoDetailsOutputSchema},
  prompt: `You are an expert at extracting specific information from YouTube videos. Your only task is to identify and return the name of the YouTube channel that uploaded the video.

Analyze the video from the provided URL. The user-provided title is for context but may be inaccurate, so rely on the video's actual data to determine the channel name.

Video URL: {{{videoUrl}}}
User-provided Title: {{{title}}}

Based on the video at the URL, what is the channel name? Ignore all other information.`,
});

const getVideoDetailsFlow = ai.defineFlow(
  {
    name: 'getVideoDetailsFlow',
    inputSchema: GetVideoDetailsInputSchema,
    outputSchema: GetVideoDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
    