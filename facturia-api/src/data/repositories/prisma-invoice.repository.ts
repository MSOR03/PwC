import {DuplicateInvoiceError} from '../../business/domain/errors';
import type {Factura} from '../../business/domain/invoice';
import type{
    CreateInvoiceInput,
    InvoiceRepository,
} from '../../business/ports/invoice.repository';
import {Prisma,type PrismaClient} from '../../generated/prisma/client';


const invoiceInclude ={proveedor:true,documento:true} satisfies Prisma.FacturaInclude;
type InvoiceRow=Prisma.FacturaGetPayload<{include: typeof invoiceInclude}>;

const toDateOnly=(date:Date)=>date.toISOString().slice(0,10);

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
  constructor(private readonly prisma: PrismaClient) {}

  async existsActive(proveedorNormalizado: string, numeroFactura: string): Promise<boolean> {
    const count = await this.prisma.factura.count({
      where: {
        numeroFactura,
        deletedAt: null,
        proveedor: { nombreNormalizado: proveedorNormalizado },
      },
    });
    return count > 0;
  }

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
          `Ya existe la factura ${invoice.numeroFactura} del proveedor ${invoice.proveedor}`,
        );
      }
      throw error;
    }
  }
}
