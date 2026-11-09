import { describe, expect, it, vi } from 'vitest';
import { PrismaInvoiceRepository } from '../../../src/data/repositories/prisma-invoice.repository';
import type { PrismaClient } from '../../../src/generated/prisma/client';

describe('PrismaInvoiceRepository.list', () => {
  it('resolves pagination and filters in the database (skip/take + where)', async () => {
    const findMany = vi.fn().mockReturnValue('findMany-query');
    const count = vi.fn().mockReturnValue('count-query');
    const prisma = {
      factura: { findMany, count },
      $transaction: vi.fn().mockResolvedValue([[], 23]),
    } as unknown as PrismaClient;

    const result = await new PrismaInvoiceRepository(prisma).list({
      page: 3,
      pageSize: 10,
      proveedor: 'ENERGIA',
      fechaDesde: '2026-01-01',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
        where: expect.objectContaining({
          deletedAt: null,
          proveedor: { nombreNormalizado: { contains: 'ENERGIA' } },
          fechaEmision: { gte: new Date('2026-01-01') },
        }),
      }),
    );
    expect(result).toMatchObject({ page: 3, pageSize: 10, total: 23, totalPages: 3 });
  });
});
