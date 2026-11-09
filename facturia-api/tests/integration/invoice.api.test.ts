/**
 * Integration tests: real Express app, middlewares, controllers, services and FakeLlmClient.
 * Only the database (repository) and the file storage are replaced by in-memory doubles,
 * so the tests run without PostgreSQL or an LLM API key.
 */
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import type { Container } from '../../src/container';
import type { Factura } from '../../src/business/domain/invoice';
import type { InvoiceRepository } from '../../src/business/ports/invoice.repository';
import type { FileStorage } from '../../src/business/ports/file.storage';
import { ExtractionService } from '../../src/business/services/extraction.service';
import { InvoiceService } from '../../src/business/services/invoice.service';
import { ReportService } from '../../src/business/services/report.service';
import { FakeLlmClient } from '../../src/data/llm/fake-llm.client';
import { InvoiceController } from '../../src/presentation/controllers/invoice.controller';
import { ReportController } from '../../src/presentation/controllers/report.controller';

const PDF = Buffer.from('%PDF-1.7\nfake invoice content');
const ID = '3f1c2b9e-8a4d-4c1e-9f7a-2b6d5e4c3a21';

const FACTURA = {
  id: ID,
  numeroFactura: 'FAKE-1234',
  fechaEmision: '2026-10-01',
  fechaLimitePago: '2026-10-15',
  valorTotal: '150000.00',
  moneda: 'COP',
  numeroCliente: null,
  editadaManualmente: false,
  proveedor: { id: 'prov-1', nombre: 'Proveedor de Pruebas S.A.S.' },
  documento: { id: 'doc-1', nombreOriginal: 'factura.pdf', mimeType: 'application/pdf', tamanoBytes: 30, fechaCarga: '2026-10-01T00:00:00.000Z' },
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
} satisfies Factura;

let repository: { [K in keyof InvoiceRepository]: ReturnType<typeof vi.fn> };
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  repository = {
    existsActive: vi.fn().mockResolvedValue(false),
    createWithDocument: vi.fn().mockResolvedValue(FACTURA),
    list: vi.fn().mockResolvedValue({ data: [FACTURA], page: 1, pageSize: 10, total: 1, totalPages: 1 }),
    findActiveById: vi.fn().mockResolvedValue(FACTURA),
    update: vi.fn().mockResolvedValue(FACTURA),
    softDelete: vi.fn().mockResolvedValue(undefined),
    summary: vi.fn().mockResolvedValue({ data: [], totalsByCurrency: [] }),
  };
  const storage: FileStorage = { save: vi.fn().mockResolvedValue('uploads/x.pdf'), delete: vi.fn() };

  const repo = repository as unknown as InvoiceRepository;
  const invoiceService = new InvoiceService(repo, new ExtractionService(new FakeLlmClient()), storage);
  const container = {
    prisma: { $queryRaw: vi.fn().mockResolvedValue([1]) },
    invoiceController: new InvoiceController(invoiceService),
    reportController: new ReportController(new ReportService(repo)),
  } as unknown as Container;

  app = createApp(container);
});

const expectProblem = (res: request.Response, status: number) => {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toContain('application/problem+json');
  expect(res.body).toMatchObject({ status, instance: expect.any(String), title: expect.any(String) });
};

describe('POST /api/facturas', () => {
  it('extracts and stores a valid PDF (201)', async () => {
    const res = await request(app).post('/api/facturas').attach('archivo', PDF, 'factura.pdf');

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/facturas/${ID}`);
    expect(repository.createWithDocument).toHaveBeenCalledOnce();
  });

  it('returns 400 when no file is sent', async () => {
    const res = await request(app).post('/api/facturas');
    expectProblem(res, 400);
  });

  it('returns 415 for a file whose content is not PDF/PNG/JPG, even with a .pdf name', async () => {
    const res = await request(app).post('/api/facturas').attach('archivo', Buffer.from('hello'), 'factura.pdf');

    expectProblem(res, 415);
    expect(repository.createWithDocument).not.toHaveBeenCalled();
  });

  it('returns 413 for a file larger than 10 MB', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1);
    PDF.copy(big);
    const res = await request(app).post('/api/facturas').attach('archivo', big, 'grande.pdf');

    expectProblem(res, 413);
  });

  it('returns 409 when provider + invoice number already exists', async () => {
    repository.existsActive.mockResolvedValue(true);
    const res = await request(app).post('/api/facturas').attach('archivo', PDF, 'factura.pdf');

    expectProblem(res, 409);
    expect(res.body.type).toContain('duplicate-invoice');
  });
});

describe('GET /api/facturas', () => {
  it('passes validated pagination and filters to the repository', async () => {
    const res = await request(app).get('/api/facturas?page=2&pageSize=5&proveedor=energía&fechaDesde=2026-01-01');

    expect(res.status).toBe(200);
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 5, proveedor: 'ENERGIA', fechaDesde: '2026-01-01' }),
    );
  });

  it('returns 400 for an invalid date range', async () => {
    const res = await request(app).get('/api/facturas?fechaDesde=2026-12-01&fechaHasta=2026-01-01');
    expectProblem(res, 400);
  });
});

describe('/api/facturas/:id', () => {
  it('returns 400 for a malformed id', async () => {
    expectProblem(await request(app).get('/api/facturas/not-a-uuid'), 400);
  });

  it('returns 404 when the invoice does not exist or was deleted', async () => {
    repository.findActiveById.mockResolvedValue(null);
    expectProblem(await request(app).get(`/api/facturas/${ID}`), 404);
  });

  it('soft deletes an invoice (204)', async () => {
    const res = await request(app).delete(`/api/facturas/${ID}`);

    expect(res.status).toBe(204);
    expect(repository.softDelete).toHaveBeenCalledWith(ID);
  });

  it('returns 400 when the due date is before the issue date', async () => {
    const res = await request(app)
      .put(`/api/facturas/${ID}`)
      .send({ ...FACTURA, proveedor: 'Energía', fechaLimitePago: '2026-09-01' });

    expectProblem(res, 400);
  });
});

describe('GET /api/facturas/reportes/resumen', () => {
  it('is not captured by the /:id route and ignores empty filters', async () => {
    const res = await request(app).get('/api/facturas/reportes/resumen?fechaDesde=&fechaHasta=2026-12-31');

    expect(res.status).toBe(200);
    expect(repository.summary).toHaveBeenCalledWith({ fechaDesde: undefined, fechaHasta: '2026-12-31' });
  });
});

describe('unknown routes', () => {
  it('returns 404 as Problem Details', async () => {
    expectProblem(await request(app).get('/api/nope'), 404);
  });
});
