import { describe, it, vi, expect } from 'vitest';
import type { InvoiceRepository } from '../../../../src/business/ports/invoice.repository';
import { ReportService } from '../../../../src/business/services/report.service';

const SUMMARY = {
  data: [
    {
      proveedorId: 'p1',
      proveedor: 'Energía del Valle',
      mes: '2026-11',
      moneda: 'COP',
      cantidad: 2,
      total: '554100.00',
    },
    {
      proveedorId: 'p2',
      proveedor: 'CloudHost Inc.',
      mes: '2026-09',
      moneda: 'USD',
      cantidad: 1,
      total: '49.99',
    },
  ],
  totalsByCurrency: [
    { moneda: 'COP', cantidad: 2, total: '554100.00' },
    { moneda: 'USD', cantidad: 1, total: '49.99' },
  ],
};

describe('ReportService.summary', () => {
  it('returns the summary for the date range', async () => {
    const repository = { summary: vi.fn().mockResolvedValue(SUMMARY) };
    const service = new ReportService(repository as unknown as InvoiceRepository);

    const result = await service.summary({ fechaDesde: '2026-09-01', fechaHasta: '2026-11-30' });

    expect(repository.summary).toHaveBeenCalledWith({
      fechaDesde: '2026-09-01',
      fechaHasta: '2026-11-30',
    });

    expect(result).toBe(SUMMARY);
  });

  it('keeps totals separate by currency', async () => {
    const repository = { summary: vi.fn().mockResolvedValue(SUMMARY) };
    const result = await new ReportService(repository as unknown as InvoiceRepository).summary({});

    const currencies = result.totalsByCurrency.map((c) => c.moneda);
    expect(currencies).toEqual(['COP', 'USD']);
  });
});
