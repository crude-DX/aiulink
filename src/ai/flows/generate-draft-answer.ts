'use server';

/**
 * @fileOverview A flow to generate a draft answer based on search results.
 *
 * - generateDraftAnswer - A function that generates a draft answer from search results.
 * - GenerateDraftAnswerInput - The input type for the generateDraftAnswer function.
 * - GenerateDraftAnswerOutput - The return type for the generateDraftAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDraftAnswerInputSchema = z.object({
  searchResults: z.string().describe('The search results to generate the draft answer from.'),
  query: z.string().describe('The original query from the user.'),
});
export type GenerateDraftAnswerInput = z.infer<typeof GenerateDraftAnswerInputSchema>;

const GenerateDraftAnswerOutputSchema = z.object({
  answer: z.string().describe('The generated draft answer.'),
});
export type GenerateDraftAnswerOutput = z.infer<typeof GenerateDraftAnswerOutputSchema>;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  return generateDraftAnswerFlow(input);
}

const generateDraftAnswerPrompt = ai.definePrompt({
  name: 'generateDraftAnswerPrompt',
  input: {schema: GenerateDraftAnswerInputSchema},
  output: {schema: GenerateDraftAnswerOutputSchema},
  prompt: `You are an AI assistant that generates a draft answer based on the search results for a given query.

  Query: {{{query}}}
  Search Results: {{{searchResults}}}

  Generate a concise and informative answer based on the search results. The answer should be in Korean.
  Do not include any source information or links in the answer.
  Do not include any introductory or concluding sentences.
  Focus on answering the question directly.
  If the search results are irrelevant, state that you cannot answer the question with the provided information.
  `,
});

const generateDraftAnswerFlow = ai.defineFlow(
  {
    name: 'generateDraftAnswerFlow',
    inputSchema: GenerateDraftAnswerInputSchema,
    outputSchema: GenerateDraftAnswerOutputSchema,
  },
  async input => {
    const {output} = await generateDraftAnswerPrompt(input);
    return output!;
  }
);
