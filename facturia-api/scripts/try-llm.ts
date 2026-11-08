import { readFileSync } from 'node:fs';
import { detectMimeType } from '../src/business/domain/file';
import { ExtractionService } from '../src/business/services/extraction.service';
import { env } from '../src/config/env';
import { GeminiLlmClient } from '../src/data/llm/gemini-llm.client';

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: npx tsx scripts/try-llm.ts <invoice.pdf|png|jpg>');

  const content = new Uint8Array(readFileSync(path));
  const mimeType = detectMimeType(content);
  if (!mimeType) throw new Error('Unsupported file type');

  const llm = new GeminiLlmClient(env.LLM_API_KEY!, env.LLM_MODEL, env.LLM_TIMEOUT_MS);
  const started = Date.now();
  const result = await new ExtractionService(llm).extract(content, mimeType);

  console.log(`Model: ${result.model} · ${Date.now() - started} ms\n`);
  console.log('Raw response:', JSON.stringify(result.rawResponse, null, 2));
  console.log('\nValidated data:', JSON.stringify(result.data, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});