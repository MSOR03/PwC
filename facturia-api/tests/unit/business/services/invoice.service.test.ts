import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NotFoundError,
  ValidationError,
  DuplicateInvoiceError,
  LlmProviderError,
  UnsupportedMediaTypeError,
} from '../../../../src/business/domain/errors';
import type { Factura } from '../../../../src/business/domain/invoice';
import type { FileStorage } from '../../../../src/business/ports/file.storage';
import type { InvoiceRepository } from '../../../../src/business/ports/invoice.repository';
import type { LlmClient } from '../../../../src/business/ports/llm.client';
import { ExtractionService } from '../../../../src/business/services/extraction.service';
import { InvoiceService } from '../../../../src/business/services/invoice.service';

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const PDF_FILE = { content: PDF, originalName: 'factura.pdf', sizeBytes: PDF.length };

const LLM_RESPONSE = {
  proveedor: 'Energía del Valle S.A. E.S.P.',
  numeroFactura: 'FE-21877',
  fechaEmision: '2026-11-05',
  fechaLimitePago: '2026-11-20',
  valorTotal: '308.800,00',
  moneda: 'COP',
  numeroCliente: '100-458-22',
};

const SAVED_INVOICE = { id: 'invoice-id', numeroFactura: 'FE-21877' } as Factura;

let llm: { extract: ReturnType<typeof vi.fn> };
let repository: {
  existsActive: ReturnType<typeof vi.fn>;
  createWithDocument: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  findActiveById: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  softDelete: ReturnType<typeof vi.fn>;
};
let storage: { save: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
let service: InvoiceService;

beforeEach(() => {
  llm = { extract: vi.fn().mockResolvedValue({ rawResponse: LLM_RESPONSE, model: 'test-model' }) };
  repository = {
    existsActive: vi.fn().mockResolvedValue(false),
    createWithDocument: vi.fn().mockResolvedValue(SAVED_INVOICE),
    list: vi.fn().mockResolvedValue({ data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 }),
    findActiveById: vi.fn().mockResolvedValue(SAVED_INVOICE),
    update: vi.fn().mockResolvedValue(SAVED_INVOICE),
    softDelete: vi.fn().mockResolvedValue(undefined),
  };
  storage = {
    save: vi.fn().mockResolvedValue('stored-file.pdf'),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  service = new InvoiceService(
    repository as unknown as InvoiceRepository,
    new ExtractionService(llm as unknown as LlmClient),
    storage as unknown as FileStorage,
  );
});

describe('InvoiceService.register', () => {
  it('extracts, saves the file and creates the invoice', async () => {
    const result = await service.register(PDF_FILE);

    expect(result).toBe(SAVED_INVOICE);
    expect(repository.existsActive).toHaveBeenCalledWith('ENERGIA DEL VALLE', 'FE-21877');
    expect(storage.save).toHaveBeenCalledWith(PDF, 'factura.pdf');

    const input = repository.createWithDocument.mock.calls[0][0];
    expect(input.proveedorNormalizado).toBe('ENERGIA DEL VALLE');
    expect(input.invoice.valorTotal).toBe('308800.00');
    expect(input.document).toMatchObject({
      mimeType: 'application/pdf',
      rutaAlmacenamiento: 'stored-file.pdf',
      modeloLlm: 'test-model',
      respuestaLlm: LLM_RESPONSE,
    });
    expect(input.document.hashSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects an invalid file before calling the LLM', async () => {
    const text = new TextEncoder().encode('not a pdf');
    const file = { content: text, originalName: 'fake.pdf', sizeBytes: text.length };

    await expect(service.register(file)).rejects.toThrow(UnsupportedMediaTypeError);
    expect(llm.extract).not.toHaveBeenCalled();
  });

  it('throws DuplicateInvoiceError and does not save anything when the invoice exists', async () => {
    repository.existsActive.mockResolvedValue(true);

    await expect(service.register(PDF_FILE)).rejects.toThrow(DuplicateInvoiceError);
    expect(storage.save).not.toHaveBeenCalled();
    expect(repository.createWithDocument).not.toHaveBeenCalled();
  });

  it('does not save anything when the LLM provider fails', async () => {
    llm.extract.mockRejectedValue(new LlmProviderError('timeout'));

    await expect(service.register(PDF_FILE)).rejects.toThrow(LlmProviderError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('deletes the stored file when the database transaction fails', async () => {
    const dbError = new Error('transaction failed');
    repository.createWithDocument.mockRejectedValue(dbError);

    await expect(service.register(PDF_FILE)).rejects.toBe(dbError);
    expect(storage.delete).toHaveBeenCalledWith('stored-file.pdf');
  });

  const UPDATE_DATA = {
    proveedor: 'Energía del Valle S.A. E.S.P.',
    numeroFactura: 'FE-21877',
    fechaEmision: '2026-11-05',
    fechaLimitePago: '2026-11-20',
    valorTotal: '310000.00',
    moneda: 'COP',
    numeroCliente: '100-458-22',
  };

  describe('InvoiceService.list', () => {
    it('normalizes the provider filter before querying', async () => {
      await service.list({ page: 1, pageSize: 10, proveedor: 'energía del valle s.a.' });
      expect(repository.list).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        proveedor: 'ENERGIA DEL VALLE',
      });
    });
  });

  describe('InvoiceService.getById', () => {
    it('throws NotFoundError when the invoice does not exist', async () => {
      repository.findActiveById.mockResolvedValue(null);
      await expect(service.getById('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('InvoiceService.update', () => {
    it('updates the invoice excluding itself from the duplicate check', async () => {
      await service.update('invoice-id', UPDATE_DATA);

      expect(repository.existsActive).toHaveBeenCalledWith(
        'ENERGIA DEL VALLE',
        'FE-21877',
        'invoice-id',
      );
      expect(repository.update).toHaveBeenCalledWith('invoice-id', {
        invoice: UPDATE_DATA,
        proveedorNormalizado: 'ENERGIA DEL VALLE',
      });
    });

    it('throws NotFoundError when the invoice does not exist', async () => {
      repository.findActiveById.mockResolvedValue(null);
      await expect(service.update('missing-id', UPDATE_DATA)).rejects.toThrow(NotFoundError);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws ValidationError when the due date is before the issue date', async () => {
      const data = { ...UPDATE_DATA, fechaLimitePago: '2026-10-01' };
      await expect(service.update('invoice-id', data)).rejects.toThrow(ValidationError);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('throws DuplicateInvoiceError when another invoice has the same number', async () => {
      repository.existsActive.mockResolvedValue(true);
      await expect(service.update('invoice-id', UPDATE_DATA)).rejects.toThrow(
        DuplicateInvoiceError,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('InvoiceService.remove', () => {
    it('soft deletes an existing invoice', async () => {
      await service.remove('invoice-id');
      expect(repository.softDelete).toHaveBeenCalledWith('invoice-id');
    });

    it('throws NotFoundError when the invoice does not exist or is already deleted', async () => {
      repository.findActiveById.mockResolvedValue(null);
      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundError);
      expect(repository.softDelete).not.toHaveBeenCalled();
    });
  });
});
