
//Data the LLM must return

export interface ExtractedInvoice {
    proveedor: string;
    numeroFactura: string;
    fechaEmision: string; //YYYY-MM-DD
    fechaLimitePago: string | null; //YYYY-MM-DD
    valorTotal: string;//decimal number as string
    moneda: string; //ISO 4217 currency code
    numeroCliente: string | null;
}

// Invoice as the business layer sees it (not the Prisma model)
export interface Factura {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaLimitePago: string | null;
  valorTotal: string;
  moneda: string;
  numeroCliente: string | null;
  editadaManualmente: boolean;
  proveedor: { id: string; nombre: string };
  documento: {
    id: string;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    fechaCarga: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type InvoiceData=ExtractedInvoice;

export interface InvoiceFilters {
  page: number;
  pageSize: number;
  proveedor?: string;
  fechaDesde?: string; // YYYY-MM-DD
  fechaHasta?: string; // YYYY-MM-DD
}

export interface Page<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
