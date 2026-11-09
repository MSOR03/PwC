import { describe, it, expect } from 'vitest';
import {
  idParamsSchema,
  listInvoiceQuerySchema,
  summaryQuerySchema,
  updateInvoiceBodySchema,
} from '../../../../src/presentation/schemas/invoice.schema';

const VALID_BODY = {
  proveedor: 'TelcoNet Colombia S.A.',
  numeroFactura: 'TN-005102',
  fechaEmision: '2026-10-28',
  fechaLimitePago: '2026-11-12',
  valorTotal: '160.531,00',
  moneda: 'cop',
  numeroCliente: 'ACC-7781',
};

// Tests for listInvoiceQuerySchema
describe('listInvoiceQuerySchema', () => {
  // Tests for default values
  it('applies default page and pageSize', () => {
    expect(listInvoiceQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 10 });
  });
  // Tests for query string conversion to numbers
  it('converts query strings to numbers', () => {
    expect(listInvoiceQuerySchema.parse({ page: '2', pageSize: '20' })).toMatchObject({
      page: 2,
      pageSize: 20,
    });
  });
  // Tests for empty filters
  it('threats empty filters as no filter', () => {
    const result = listInvoiceQuerySchema.parse({ proveedor: '', fechaDesde: '' });
    expect(result.proveedor).toBeUndefined();
    expect(result.fechaDesde).toBeUndefined();
  });

  // Tests for invalid queries
  it.each([
    [{ page: '0' }],
    [{ pageSize: '101' }],
    [{ fechaDesde: '2026-13-01' }],
    [{ fechaDesde: '2026-02-30', fechaHasta: '2026-02-28' }],
  ])('rejects invalid query', (query) => {
    expect(listInvoiceQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('summaryQuerySchema', () => {
  // Tests for summary query schema
  it('accepts an empty range', () => {
    expect(summaryQuerySchema.safeParse({}).success).toBe(true);
  });
  // Tests for valid ranges
  it('rejects a range where fechaDesde is after fechaHasta', () => {
    const result = summaryQuerySchema.safeParse({
      fechaDesde: '2026-12-01',
      fechaHasta: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });
});
// Tests for idParamsSchema
describe('idParamsSchema', () => {
  it('rejects an id that is not a UUID', () => {
    expect(idParamsSchema.safeParse({ id: '123' }).success).toBe(false);
  });
});

describe('updateInvoiceBodySchema', () => {
  // Tests for updateInvoiceBodySchema
  it('normalizes amount and currency', () => {
    const result = updateInvoiceBodySchema.parse(VALID_BODY);
    expect(result.valorTotal).toBe('160531.00');
    expect(result.moneda).toBe('COP');
  });

  // Tests for optional fields normalization

  it('sets optional fields to null when missing or empty', () => {
    const { fechaLimitePago: _f, ...rest } = VALID_BODY;
    const result = updateInvoiceBodySchema.parse({ ...rest, numeroCliente: '' });
    expect(result.fechaLimitePago).toBeNull();
    expect(result.numeroCliente).toBeNull();
  });

  it.each([
    [{ valorTotal: '-5' }],
    [{ valorTotal: '0' }],
    [{ moneda: 'pesos' }],
    [{ fechaEmision: '28/10/2026' }],
    [{ numeroFactura: '' }],
  ])('rejects invalid field %o', (change) => {
    expect(updateInvoiceBodySchema.safeParse({ ...VALID_BODY, ...change }).success).toBe(false);
  });
});
