import {GoogleGenAI} from '@google/genai';
import {LlmProviderError} from '../../business/domain/errors';
import type {AllowedMimeType} from '../../business/domain/file';
import type { LlmClient,LlmExtractionResult } from '../../business/ports/llm.client';
import {
    EXTRACTION_JSON_SCHEMA,
    EXTRACTION_PROMPT,
} from '../../business/services/extraction.prompt';

export class GeminiLlmClient implements LlmClient {
    // Private property for the GoogleGenAI instance
    private readonly ai: GoogleGenAI;

    // Constructor for the GeminiLlmClient class
    constructor(
        apiKey: string,
        private readonly model: string,
        private readonly timeoutMs: number,
    ) {
        
        this.ai = new GoogleGenAI({ apiKey });
    }
    // Method to extract structured data from the content using the LLM

    async extract(content:Uint8Array,mimeType: AllowedMimeType): Promise<LlmExtractionResult> {
        let text:string|undefined;

        try {
            // Generate content using the GoogleGenAI model with the specified configuration
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents:[
                    {
                        role:'user',
                        // Parts of the message, including the file content and the extraction prompt
                        parts:[
                            {inlineData: {mimeType, data: Buffer.from(content).toString('base64')}},
                            {text: EXTRACTION_PROMPT},
                        ]
                    }
                ],
                // Configuration for the model generation, including response type, schema, temperature, and timeout
                config:{
                    responseMimeType: 'application/json',
                    responseSchema:EXTRACTION_JSON_SCHEMA,
                    temperature:0,
                    abortSignal:AbortSignal.timeout(this.timeoutMs)
                },
            });

            text = response.text;
        
        }catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new LlmProviderError(`The ai provider did not respond correctly: ${reason}`);
    }

    if (!text) {
      throw new LlmProviderError('The ai provider returned an empty response');
    }

    try {
      return { rawResponse: JSON.parse(text), model: this.model };
    } catch {
      throw new LlmProviderError('The ai provider returned a response that is not JSON');
    }
  }
}