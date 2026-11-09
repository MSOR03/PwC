import { describe, expect, it } from 'vitest';
import { facturaFormSchema, toFacturaUpdate, type FacturaFormValues } from './factura.schema';

const VALID: FacturaFormValues = {
  proveedor: 'TelcoNet Colombia S.A.',
  numeroFactura: 'TN-005102',
  fechaEmision: '2026-10-28',
  fechaLimitePago: '2026-11-12',
  valorTotal: '160531.00',
  moneda: 'COP',
  numeroCliente: 'ACC-7781',
};

describe('facturaFormSchema', () => {
  it('accepts valid values', () => {
    expect(facturaFormSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts empty optional fields', () => {
    const result = facturaFormSchema.safeParse({ ...VALID, fechaLimitePago: '', numeroCliente: '' });
    expect(result.success).toBe(true);
  });

  it.each([
    ['proveedor', { proveedor: '   ' }],
    ['numeroFactura', { numeroFactura: '' }],
    ['fechaEmision', { fechaEmision: '' }],
    ['valorTotal', { valorTotal: '0' }],
    ['valorTotal', { valorTotal: '-10' }],
    ['valorTotal', { valorTotal: 'abc' }],
    ['moneda', { moneda: '' }],
  ])('rejects an invalid %s', (field, change) => {
    const result = facturaFormSchema.safeParse({ ...VALID, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([field]);
  });

  it('rejects a due date before the issue date', () => {
    const result = facturaFormSchema.safeParse({ ...VALID, fechaLimitePago: '2026-10-01' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['fechaLimitePago']);
  });
});

describe('toFacturaUpdate', () => {
  it('converts empty optional fields to null and comma decimals to dot', () => {
    const update = toFacturaUpdate({ ...VALID, fechaLimitePago: '', numeroCliente: '', valorTotal: '160531,50' });
    expect(update.fechaLimitePago).toBeNull();
    expect(update.numeroCliente).toBeNull();
    expect(update.valorTotal).toBe('160531.50');
  });
});