import { createHash } from 'node:crypto'
import type { AllowedMimeType } from '../../business/domain/file';
import type { LlmClient, LlmExtractionResult } from '../../business/ports/llm.client';


// Deterministic LLM for local development without an API key, CI and integration tests
export class FakeLlmClient implements LlmClient {

    async extract(content: Uint8Array, _mimeType: AllowedMimeType): Promise<LlmExtractionResult> {
        const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
        return {

            model: 'fake',
            rawResponse: {
                proveedor: 'Proveedor de Pruebas S.A.S.',
                numeroFactura: `FAKE-${hash}`,
                fechaEmision: '2026-10-01',
                fechaLimitePago: '2026-10-15',
                valorTotal: '150000.00',
                moneda: 'COP',
                numeroCliente: null,
            }

        };
    }
}