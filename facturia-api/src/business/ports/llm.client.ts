import type { AllowedMimeType } from '../domain/file';

export interface LlmExtractionResult {
  rawResponse: unknown; // what the model returned, not validated yet
  model: string; // e.g. "gemini-3.5-flash", saved for auditing
}

export interface LlmClient {
  // Must throw LlmProviderError if the provider fails, times out or returns non-JSON
  extract(content: Uint8Array, mimeType: AllowedMimeType): Promise<LlmExtractionResult>;
}