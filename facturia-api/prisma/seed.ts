import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const proveedores = [
  { nombre: 'Energía del Valle S.A. E.S.P.', nombreNormalizado: 'ENERGIA DEL VALLE', nit: '900123456-1' },
  { nombre: 'Aguas Metropolitanas S.A.S.', nombreNormalizado: 'AGUAS METROPOLITANAS', nit: '900654321-7' },
  { nombre: 'TelcoNet Colombia S.A.', nombreNormalizado: 'TELCONET COLOMBIA', nit: '830111222-3' },
  { nombre: 'CloudHost Inc.', nombreNormalizado: 'CLOUDHOST', nit: null },
];

const facturas = [
  { proveedor: 'ENERGIA DEL VALLE', numero: 'FE-20431', emision: '2026-10-05', limite: '2026-10-20', total: '245300.00', moneda: 'COP', cliente: '100-458-22' },
  { proveedor: 'AGUAS METROPOLITANAS', numero: 'AM-88712', emision: '2026-10-02', limite: '2026-10-18', total: '98450.00', moneda: 'COP', cliente: 'CT-55102' },
  { proveedor: 'TELCONET COLOMBIA', numero: 'TN-004519', emision: '2026-09-28', limite: null, total: '159900.00', moneda: 'COP', cliente: null },
  { proveedor: 'CLOUDHOST', numero: 'INV-3391', emision: '2026-09-25', limite: '2026-10-10', total: '49.99', moneda: 'USD', cliente: 'ACC-7781' },
];

async function main() {
  // Start from a clean state so the seed can run many times
  await prisma.factura.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.proveedor.deleteMany();

  const ids = new Map<string, string>();
  for (const p of proveedores) {
    const created = await prisma.proveedor.create({ data: p });
    ids.set(p.nombreNormalizado, created.id);
  }

  for (const f of facturas) {
    const archivo = `${f.numero}.pdf`;
    await prisma.factura.create({
      data: {
        numeroFactura: f.numero,
        fechaEmision: new Date(f.emision),
        fechaLimitePago: f.limite ? new Date(f.limite) : null,
        valorTotal: f.total,
        moneda: f.moneda,
        numeroCliente: f.cliente,
        proveedor: { connect: { id: ids.get(f.proveedor)! } },
        documento: {
          create: {
            nombreOriginal: archivo,
            mimeType: 'application/pdf',
            tamanoBytes: 120_000,
            rutaAlmacenamiento: `seed/${archivo}`,
            hashSha256: createHash('sha256').update(archivo).digest('hex'),
            respuestaLlm: { ...f, fuente: 'seed' },
            modeloLlm: 'seed',
          },
        },
      },
    });
  }

  console.log(`Seed completed: ${proveedores.length} providers, ${facturas.length} invoices`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());