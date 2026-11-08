import {env} from './config/env';
import type {LlmClient} from './business/ports/llm.client';
import {ExtractionService} from './business/services/extraction.service';
import {FakeLlmClient} from './data/llm/fake-llm.client';
import { GeminiLlmClient } from './data/llm/gemini-llm.client';
import { prisma } from './data/prisma';

// Composition root: the only place that knows the concrete implementations.
// Repositories, the LLM adapter and the services are wired here in issues #4 and #5.

export function buildLlmClient():LlmClient {
  if(env.LLM_PROVIDER === 'fake') return new FakeLlmClient();
  return new GeminiLlmClient(env.LLM_API_KEY!,env.LLM_MODEL,env.LLM_TIMEOUT_MS);
}

export function buildContainer() {
  const llmClient = buildLlmClient();
  const extractionService = new ExtractionService(llmClient);

  return {
    extractionService,
    prisma,
  };
}

export type Container = ReturnType<typeof buildContainer>;




