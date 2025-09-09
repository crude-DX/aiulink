'use server';

/**
 * @fileOverview A flow to generate a draft answer based on search results.
 *
 * - generateDraftAnswer - A function that generates a draft answer from search results.
 * - generateDraftAnswerStream - A streaming version of the answer generation.
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

const generateDraftAnswerPrompt = `You are an AI assistant. Your primary goal is to answer the user's query directly and accurately.
Use the provided Search Results as context to formulate your answer.

User Query: {{{query}}}
Search Results:
{{{searchResults}}}

Based on the User Query, generate a concise and informative answer in Korean using only the information from the Search Results.
- Answer the User Query precisely.
- Do not include any introductory or concluding remarks.
- Do not include source information or links.
- If the Search Results are irrelevant to the User Query, state that you cannot answer the question with the provided information.

Example:
User Query: "지난달 PE 생산량 중에서 MI 지수 2 이상 비중이 몇 퍼센트였어?"
Search Results:
Source: PE-Master
Title: PE 생산량 및 MI 지수 분석
Snippet: 지난달 PE 총 생산량 120,000톤 중 MI 지수 2.0 이상 제품은 36.5% (43,800톤)를 차지했습니다.

Answer:
{
  "answer": "지난달 PE 총 생산량 중 MI 지수 2.0 이상 제품은 36.5%를 차지했습니다."
}
`;

export async function generateDraftAnswer(input: GenerateDraftAnswerInput): Promise<GenerateDraftAnswerOutput> {
  const {output} = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: generateDraftAnswerPrompt,
    input: input,
    output: {
      format: 'json',
      schema: GenerateDraftAnswerOutputSchema
    }
  });
  return output!;
}

export async function generateDraftAnswerStream(input: GenerateDraftAnswerInput): Promise<ReadableStream<string>> {
  const {stream} = ai.generateStream({
    model: 'googleai/gemini-2.5-flash',
    prompt: generateDraftAnswerPrompt,
    input: input,
  });

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(encoder.encode(chunk.text));
      }
      controller.close();
    },
  });

  return readableStream;
}
