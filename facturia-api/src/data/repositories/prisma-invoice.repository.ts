
import { DuplicateInvoiceError } from '../../business/domain/errors';
import type { Factura, InvoiceFilters, Page, DateRangeFilters, InvoiceSummary } from '../../business/domain/invoice';
import type {
  CreateInvoiceInput,
  InvoiceRepository,
  UpdateInvoiceInput,
} from '../../business/ports/invoice.repository';
import { Prisma, type PrismaClient } from '../../generated/prisma/client';


const invoiceInclude = { proveedor: true, documento: true } satisfies Prisma.FacturaInclude;
type InvoiceRow = Prisma.FacturaGetPayload<{ include: typeof invoiceInclude }>;

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

// Converts the Prisma model into the domain type (the business layer never sees Prisma)
export function toFactura(row: InvoiceRow): Factura {
  return {
    id: row.id,
    numeroFactura: row.numeroFactura,
    fechaEmision: toDateOnly(row.fechaEmision),
    fechaLimitePago: row.fechaLimitePago ? toDateOnly(row.fechaLimitePago) : null,
    valorTotal: row.valorTotal.toFixed(2),
    moneda: row.moneda,
    numeroCliente: row.numeroCliente,
    editadaManualmente: row.editadaManualmente,
    proveedor: { id: row.proveedor.id, nombre: row.proveedor.nombre },
    documento: {
      id: row.documento.id,
      nombreOriginal: row.documento.nombreOriginal,
      mimeType: row.documento.mimeType,
      tamanoBytes: row.documento.tamanoBytes,
      fechaCarga: row.documento.fechaCarga.toISOString(),
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async existsActive(
    proveedorNormalizado: string,
    numeroFactura: string,
    excludeId?: string
  ): Promise<boolean> {
    const count = await this.prisma.factura.count({
      where: {
        numeroFactura,
        deletedAt: null,
        proveedor: { nombreNormalizado: proveedorNormalizado },
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
    });
    return count > 0;
  }

  async list({
    page,
    pageSize,
    proveedor,
    fechaDesde,
    fechaHasta
  }: InvoiceFilters): Promise<Page<Factura>> {

    const where: Prisma.FacturaWhereInput = {
      deletedAt: null,
      ...(proveedor ? { proveedor: { nombreNormalizado: { contains: proveedor } } } : {}),
      ...(fechaDesde || fechaHasta ? {
        fechaEmision: {
          ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
          ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
        },
      }
        : {}),
    };

    // Fetch the list of invoices and the total count in a single transaction for pagination purposes.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.factura.findMany({
        where,
        include: invoiceInclude,
        orderBy: [{ fechaEmision: 'desc' }, { createdAt: 'desc' }],
        // Pagination resolved in the database (LIMIT / OFFSET), never in memory
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.factura.count({ where }),
    ]);

    return {
      data: rows.map(toFactura),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Find an active invoice by its ID.
  async findActiveById(id: string): Promise<Factura | null> {
    const row = await this.prisma.factura.findFirst({
      where: { id, deletedAt: null },
      include: invoiceInclude,
    });
    return row ? toFactura(row) : null;
  }

  //Update an existing invoice by its ID, handling potential duplicate invoice errors.
  async update(id: string, { invoice, proveedorNormalizado }: UpdateInvoiceInput): Promise<Factura> {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const proveedor = await tx.proveedor.upsert({
          where: { nombreNormalizado: proveedorNormalizado },
          update: {},
          create: { nombre: invoice.proveedor, nombreNormalizado: proveedorNormalizado },
        });

        return tx.factura.update({
          where: { id },
          data: {
            proveedorId: proveedor.id,
            numeroFactura: invoice.numeroFactura,
            fechaEmision: new Date(invoice.fechaEmision),
            fechaLimitePago: invoice.fechaLimitePago ? new Date(invoice.fechaLimitePago) : null,
            valorTotal: invoice.valorTotal,
            moneda: invoice.moneda,
            numeroCliente: invoice.numeroCliente,
            editadaManualmente: true,
          },
          include: invoiceInclude,
        });
      });

      return toFactura(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateInvoiceError(
          `Invoice ${invoice.numeroFactura} for provider '${invoice.proveedor}' already exists`,
        );
      }
      throw error;
    }
  }

  // Soft delete an invoice by setting its deletedAt timestamp.
  async softDelete(id: string): Promise<void> {
    await this.prisma.factura.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Create a new invoice along with its associated document.
  async createWithDocument({
    invoice,
    proveedorNormalizado,
    document,
  }: CreateInvoiceInput): Promise<Factura> {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const proveedor = await tx.proveedor.upsert({
          where: { nombreNormalizado: proveedorNormalizado },
          update: {},
          create: { nombre: invoice.proveedor, nombreNormalizado: proveedorNormalizado },
        });

        const documento = await tx.documento.create({
          data: { ...document, respuestaLlm: document.respuestaLlm as Prisma.InputJsonValue },
        });

        return tx.factura.create({
          data: {
            proveedorId: proveedor.id,
            documentoId: documento.id,
            numeroFactura: invoice.numeroFactura,
            fechaEmision: new Date(invoice.fechaEmision),
            fechaLimitePago: invoice.fechaLimitePago ? new Date(invoice.fechaLimitePago) : null,
            valorTotal: invoice.valorTotal,
            moneda: invoice.moneda,
            numeroCliente: invoice.numeroCliente,
          },
          include: invoiceInclude,
        });
      });

      return toFactura(row);
    } catch (error) {
      // Unique violation: another request saved the same invoice between the check and the insert
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new DuplicateInvoiceError(
          `Invoice ${invoice.numeroFactura} for provider '${invoice.proveedor}' already exists`,
        );
      }
      throw error;
    }
  }

  async summary({ fechaDesde, fechaHasta }: DateRangeFilters): Promise<InvoiceSummary> {
    // Parameterized conditions: values go as SQL parameters, never concatenated
    const conditions = [Prisma.sql`f.deleted_at IS NULL`];
    if (fechaDesde) conditions.push(Prisma.sql`f.fecha_emision >= ${fechaDesde}::date`);
    if (fechaHasta) conditions.push(Prisma.sql`f.fecha_emision <= ${fechaHasta}::date`);
    const where = Prisma.join(conditions, ' AND ');

    const rows = await this.prisma.$queryRaw<
      { proveedor_id: string; proveedor: string; mes: string; moneda: string; cantidad: number; total: string }[]
    >`
      SELECT p.id                                                AS proveedor_id,
             p.nombre                                            AS proveedor,
             to_char(date_trunc('month', f.fecha_emision), 'YYYY-MM') AS mes,
             f.moneda                                            AS moneda,
             COUNT(*)::int                                       AS cantidad,
             SUM(f.valor_total)::text                            AS total
      FROM factura f
      JOIN proveedor p ON p.id = f.proveedor_id
      WHERE ${where}
      GROUP BY p.id, p.nombre, mes, f.moneda
      ORDER BY mes DESC, p.nombre, f.moneda
    `;

    const totals = await this.prisma.$queryRaw<
      { moneda: string; cantidad: number; total: string }[]
    >`
      SELECT f.moneda                  AS moneda,
             COUNT(*)::int             AS cantidad,
             SUM(f.valor_total)::text  AS total
      FROM factura f
      WHERE ${where}
      GROUP BY f.moneda
      ORDER BY f.moneda
    `;

    return {
      data: rows.map((row) => ({
        proveedorId: row.proveedor_id,
        proveedor: row.proveedor,
        mes: row.mes,
        moneda: row.moneda,
        cantidad: row.cantidad,
        total: row.total,
      })),
      totalsByCurrency: totals,
    };
  }


}
