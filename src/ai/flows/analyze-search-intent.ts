'use server';

/**
 * @fileOverview Analyzes the intent behind a search query to route it to the most appropriate data sources.
 *
 * - analyzeSearchIntent - A function that analyzes the search intent.
 * - AnalyzeSearchIntentInput - The input type for the analyzeSearchIntent function.
 * - AnalyzeSearchIntentOutput - The return type for the analyzeSearchIntent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSearchIntentInputSchema = z.object({
  query: z.string().describe('The user search query.'),
});
export type AnalyzeSearchIntentInput = z.infer<typeof AnalyzeSearchIntentInputSchema>;

const AnalyzeSearchIntentOutputSchema = z.object({
  intent: z.string().describe('The intent behind the search query.'),
  dataSources: z
    .array(z.string())
    .describe('The data sources to route the query to.'),
});
export type AnalyzeSearchIntentOutput = z.infer<typeof AnalyzeSearchIntentOutputSchema>;

export async function analyzeSearchIntent(input: AnalyzeSearchIntentInput): Promise<AnalyzeSearchIntentOutput> {
  return analyzeSearchIntentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSearchIntentPrompt',
  input: {schema: AnalyzeSearchIntentInputSchema},
  output: {schema: AnalyzeSearchIntentOutputSchema},
  prompt: `You are an expert search intent analyzer. Analyze the intent behind the following search query and determine the most appropriate data sources to route the query to.

Query: {{{query}}}

Consider these data sources:
- Knowledge Base: for policies, procedures, and manuals
- Database: for performance, metrics, and structured data
- API: for data from internal systems
- File System: for documents in GDrive, Confluence, etc.

Output the intent and an array of the most relevant data sources.

Example:
Input: "AiU 의료비 자동화 보안 검토 절차와 담당자 연락처"
Output:
{
  "intent": "Inquiry about AiU medical expense automation security review procedures and contact information.",
  "dataSources": ["Knowledge Base", "File System"]
}
`,
});

const analyzeSearchIntentFlow = ai.defineFlow(
  {
    name: 'analyzeSearchIntentFlow',
    inputSchema: AnalyzeSearchIntentInputSchema,
    outputSchema: AnalyzeSearchIntentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
