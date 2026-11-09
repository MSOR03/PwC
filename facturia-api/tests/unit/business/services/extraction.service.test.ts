import { describe, expect, it, vi } from 'vitest';
import { ExtractionError, LlmProviderError } from '../../../../src/business/domain/errors';
import type { LlmClient } from '../../../../src/business/ports/llm.client';
import { ExtractionService } from '../../../../src/business/services/extraction.service';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const VALID_RESPONSE = {
  proveedor: 'Energía del Valle S.A. E.S.P.',
  numeroFactura: 'FE-20431',
  fechaEmision: '2026-10-05',
  fechaLimitePago: '2026-10-20',
  valorTotal: '245.300,00',
  moneda: 'cop',
  numeroCliente: '100-458-22',
};

function serviceReturning(rawResponse: unknown) {
  const llm: LlmClient = {
    extract: vi.fn().mockResolvedValue({ rawResponse, model: 'test-model' }),
  };
  return new ExtractionService(llm);
}

describe('ExtractionService', () => {
  it('returns clean data when the LLM response is valid', async () => {
    const result = await serviceReturning(VALID_RESPONSE).extract(PDF, 'application/pdf');

    expect(result.data).toEqual({
      proveedor: 'Energía del Valle S.A. E.S.P.',
      numeroFactura: 'FE-20431',
      fechaEmision: '2026-10-05',
      fechaLimitePago: '2026-10-20',
      valorTotal: '245300.00',
      moneda: 'COP',
      numeroCliente: '100-458-22',
    });
    expect(result.model).toBe('test-model');
    expect(result.rawResponse).toBe(VALID_RESPONSE);
  });

  it('accepts missing optional fields', async () => {
    const { fechaLimitePago: _f, numeroCliente: _n, ...required } = VALID_RESPONSE;
    const result = await serviceReturning(required).extract(PDF, 'application/pdf');

    expect(result.data.fechaLimitePago).toBeNull();
    expect(result.data.numeroCliente).toBeNull();
  });

  it('throws ExtractionError when a required field is missing', async () => {
    const { numeroFactura: _omit, ...incomplete } = VALID_RESPONSE;
    await expect(serviceReturning(incomplete).extract(PDF, 'application/pdf')).rejects.toThrow(
      ExtractionError,
    );
  });

  it('throws ExtractionError when the issue date is not a real date', async () => {
    const service = serviceReturning({ ...VALID_RESPONSE, fechaEmision: '2026-02-30' });
    await expect(service.extract(PDF, 'application/pdf')).rejects.toThrow(ExtractionError);
  });

  it('throws ExtractionError when the total is not a positive number', async () => {
    const service = serviceReturning({ ...VALID_RESPONSE, valorTotal: 'N/A' });
    await expect(service.extract(PDF, 'application/pdf')).rejects.toThrow(ExtractionError);
  });

  it('throws ExtractionError when the currency is not an ISO code', async () => {
    const service = serviceReturning({ ...VALID_RESPONSE, moneda: 'pesos' });
    await expect(service.extract(PDF, 'application/pdf')).rejects.toThrow(ExtractionError);
  });

  it('drops a due date that is before the issue date', async () => {
    const service = serviceReturning({ ...VALID_RESPONSE, fechaLimitePago: '2026-09-01' });
    const result = await service.extract(PDF, 'application/pdf');
    expect(result.data.fechaLimitePago).toBeNull();
  });

  it('lets LlmProviderError from the adapter propagate', async () => {
    const llm: LlmClient = {
      extract: vi.fn().mockRejectedValue(new LlmProviderError('timeout')),
    };
    await expect(new ExtractionService(llm).extract(PDF, 'application/pdf')).rejects.toThrow(
      LlmProviderError,
    );
  });
});
