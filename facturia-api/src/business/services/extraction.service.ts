import { z } from 'zod'
import { ExtractionError } from '../domain/errors';
import type { AllowedMimeType } from '../domain/file';
import type { ExtractedInvoice } from '../domain/invoice';
import { normalizeAmount } from '../domain/money';
import type { LlmClient } from '../ports/llm.client'
import { isValidIsoDate } from '../domain/date';



const dateSchema = z.
    string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must use YYYY-MM-DD format')
    .refine(isValidIsoDate, 'Invalid date');

//LLM response format
const llmOutputSchema = z.object({
    proveedor: z.string().trim().min(1),
    numeroFactura: z.string().trim().min(1),
    fechaEmision: dateSchema,
    fechaLimitePago: dateSchema.nullish(),
    valorTotal: z.union([z.number(), z.string()]),
    moneda: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, 'Must be an ISO 4217 currency code'),
    numeroCliente: z.string().trim().min(1).nullish(),
});

export interface ExtractionResult {
  data: ExtractedInvoice;
  rawResponse: unknown;
  model: string;
}

//Validates and cleans the raw LLM response
export function parseExtraction(raw: unknown): ExtractedInvoice {
    const parsed = llmOutputSchema.safeParse(raw);
    if (!parsed.success) {
        throw new ExtractionError(
            'The AI could not extract the required invoice fields',
            parsed.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        );
    }

    const data = parsed.data;
    const valorTotal = normalizeAmount(data.valorTotal);
    if (!valorTotal) {
        throw new ExtractionError('The extracted total amount is not a valid positive number', [
            { field: 'valorTotal', message: `Received value: ${String(data.valorTotal)}` },
        ]);
    }

    // A due date before the issue date is an LLM mistake: drop the optional field
    const fechaLimitePago =
        data.fechaLimitePago && data.fechaLimitePago >= data.fechaEmision
            ? data.fechaLimitePago
            : null;

    return {
        proveedor: data.proveedor,
        numeroFactura: data.numeroFactura,
        fechaEmision: data.fechaEmision,
        fechaLimitePago,
        valorTotal,
        moneda: data.moneda,
        numeroCliente: data.numeroCliente ?? null,
    };
}

export class ExtractionService {
    constructor(private readonly llm: LlmClient) { }

    // LlmProviderError (502) from the adapter propagates as is
    async extract(content: Uint8Array, mimeType: AllowedMimeType): Promise<ExtractionResult> {
        const { rawResponse, model } = await this.llm.extract(content, mimeType);
        return { data: parseExtraction(rawResponse), rawResponse, model };
    }
}

