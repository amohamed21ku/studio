'use server';
/**
 * @fileOverview An AI agent that converts the whole face to grey automatically.
 *
 * - monochromeMask - A function that handles the conversion process.
 * - MonochromeMaskInput - The input type for the monochromeMask function.
 * - MonochromeMaskOutput - The return type for the monochromeMask function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const MonochromeMaskInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the face photo.'),
});
export type MonochromeMaskInput = z.infer<typeof MonochromeMaskInputSchema>;

const MonochromeMaskOutputSchema = z.object({
  maskUrl: z.string().describe('The URL of the monochrome masked face.'),
});
export type MonochromeMaskOutput = z.infer<typeof MonochromeMaskOutputSchema>;

export async function monochromeMask(input: MonochromeMaskInput): Promise<MonochromeMaskOutput> {
  return monochromeMaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'monochromeMaskPrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the face photo.'),
    }),
  },
  output: {
    schema: z.object({
      maskUrl: z.string().describe('The URL of the monochrome masked face.'),
    }),
  },
  prompt: `You are an AI expert at masking the whole face in an image in grey color.
The provided image is at the following URL: {{media url=photoUrl}}
Return URL of the image with the face masked in grey.`,
});

const monochromeMaskFlow = ai.defineFlow<
  typeof MonochromeMaskInputSchema,
  typeof MonochromeMaskOutputSchema
>(
  {
    name: 'monochromeMaskFlow',
    inputSchema: MonochromeMaskInputSchema,
    outputSchema: MonochromeMaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
