import { describe, it, expect } from 'vitest';
import { Prisma } from '../../../src/generated/prisma/client';
import { toFactura } from '../../../src/data/repositories/prisma-invoice.repository';

describe('toFactura', () => {
  const row = {
    id: 'f1',
    proveedorId: 'p1',
    documentoId: 'd1',
    numeroFactura: 'FE-21877',
    fechaEmision: new Date('2026-11-05T00:00:00Z'),
    fechaLimitePago: null,
    valorTotal: new Prisma.Decimal('308800'),
    moneda: 'COP',
    numeroCliente: null,
    editadaManualmente: false,
    createdAt: new Date('2026-11-08T14:35:14.807Z'),
    updatedAt: new Date('2026-11-08T14:35:14.807Z'),
    deletedAt: null,
    proveedor: {
      id: 'p1',
      nombre: 'Energía del Valle S.A. E.S.P.',
      nombreNormalizado: 'ENERGIA DEL VALLE',
      nit: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    documento: {
      id: 'd1',
      nombreOriginal: 'factura.pdf',
      mimeType: 'application/pdf',
      tamanoBytes: 2743,
      rutaAlmacenamiento: 'abc.pdf',
      hashSha256: 'a'.repeat(64),
      respuestaLlm: {},
      modeloLlm: 'test',
      fechaCarga: new Date('2026-11-08T14:35:14.798Z'),
    },
  };

  // Test for decimal to string conversion
  it('converts decimal to a string with 2 decimals', () => {
    expect(toFactura(row).valorTotal).toBe('308800.00');
  });

  // Test for date columns formatting
  it('returns date colums as YYYY-MM-DD without timezone shifts', () => {
    expect(toFactura(row).fechaEmision).toBe('2026-11-05');
    expect(toFactura(row).fechaLimitePago).toBe(null);
  });

  // Test for internal fields not being exposed
  it('does not expose internal fields like storage path or the hash', () => {
    const factura = toFactura(row);
    expect(factura.documento).not.toHaveProperty('rutaAlmacenamiento');
    expect(factura.documento).not.toHaveProperty('hashSha256');
  });
});
