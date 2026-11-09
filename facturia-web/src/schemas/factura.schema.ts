import { z } from 'zod';
import type { Factura, FacturaUpdate } from '../models/factura';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT = /^\d+([.,]\d{1,2})?$/;

export const facturaFormSchema = z
  .object({
    proveedor: z.string().trim().min(1, 'El proveedor es obligatorio').max(200, 'Máximo 200 caracteres'),
    numeroFactura: z
      .string()
      .trim()
      .min(1, 'El número de factura es obligatorio')
      .max(100, 'Máximo 100 caracteres'),
    fechaEmision: z.string().regex(DATE, 'Ingresa una fecha válida'),
    fechaLimitePago: z.string().refine((value) => value === '' || DATE.test(value), 'Ingresa una fecha válida'),
    valorTotal: z
      .string()
      .trim()
      .regex(AMOUNT, 'Usa solo números, ej. 245300.50')
      .refine((value) => Number(value.replace(',', '.')) > 0, 'El valor debe ser mayor que 0'),
    moneda: z.string().regex(/^[A-Z]{3}$/, 'Selecciona una moneda'),
    numeroCliente: z.string().trim().max(100, 'Máximo 100 caracteres'),
  })
  .refine((v) => !v.fechaLimitePago || v.fechaLimitePago >= v.fechaEmision, {
    message: 'Debe ser igual o posterior a la fecha de emisión',
    path: ['fechaLimitePago'],
  });

export type FacturaFormValues = z.infer<typeof facturaFormSchema>;

// API → form (inputs work with strings, never null)
export function toFormValues(factura: Factura): FacturaFormValues {
  return {
    proveedor: factura.proveedor.nombre,
    numeroFactura: factura.numeroFactura,
    fechaEmision: factura.fechaEmision,
    fechaLimitePago: factura.fechaLimitePago ?? '',
    valorTotal: factura.valorTotal,
    moneda: factura.moneda,
    numeroCliente: factura.numeroCliente ?? '',
  };
}

// Form → API (empty optional fields become null, comma becomes dot)
export function toFacturaUpdate(values: FacturaFormValues): FacturaUpdate {
  return {
    proveedor: values.proveedor,
    numeroFactura: values.numeroFactura,
    fechaEmision: values.fechaEmision,
    fechaLimitePago: values.fechaLimitePago || null,
    valorTotal: values.valorTotal.replace(',', '.'),
    moneda: values.moneda,
    numeroCliente: values.numeroCliente || null,
  };
}