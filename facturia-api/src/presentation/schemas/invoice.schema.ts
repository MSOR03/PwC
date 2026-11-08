import { z } from 'zod';
import { isValidIsoDate } from '../../business/domain/date';
import { normalizeAmount } from '../../business/domain/money';

const isoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must use YYYY-MM-DD format')
    .refine(isValidIsoDate, 'Not a valid date');


const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

export const idParamsSchema = z.object({
    id: z.string().uuid('Must be a valid UUID')
});

export const invoiceSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    proveedor: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    fechaDesde: z.preprocess(emptyToUndefined, isoDate.optional()),
    fechaHasta: z.preprocess(emptyToUndefined, isoDate.optional()),
})
    .refine((q) => !q.fechaDesde || !q.fechaHasta || q.fechaDesde <= q.fechaHasta, {
        message: 'fechaDesde must be before or equal to fechaHasta',
        path: ['fechaHasta'],
    });

export const updateInvoiceBodySchema = z.object({

    proveedor: z.string().trim().min(1).max(200),
    numeroFactura: z.string().trim().min(1).max(100),
    fechaEmision: isoDate,
    fechaLimitePago: isoDate.nullable().default(null),
    valorTotal: z.union([z.number(), z.string()]).transform((value, ctx) => {
        const amount = normalizeAmount(value);
        if (!amount) {
            ctx.addIssue({
                code: 'custom',
                message: 'Must be positive number'
            });
            return z.NEVER;
        }
        return amount;
    }),
    moneda: z.
        string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z]{3}$/, 'Must be an ISO 4217 code'),

    numeroCliente: z.
        string()
        .trim()
        .max(100)
        .nullable()
        .default(null)
        .transform((value) => value || null)
});

export type ListInvoicesQuery = z.infer<typeof invoiceSchema>;
export type UpdateInvoiceBody = z.infer<typeof updateInvoiceBodySchema>;
export type IdParams = z.infer<typeof idParamsSchema>;

