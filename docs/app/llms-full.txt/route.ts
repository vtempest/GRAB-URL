/**
 * @file route.ts
 * @description API route that generates a full text version of the documentation for LLM consumption.
 */
import { source } from '@/lib/fumadocs/source';
import { getLLMText } from '@/lib/fumadocs/get-llm-text';

// cached forever
export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}