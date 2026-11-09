//mirror of the Factura model from the backend API
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

export interface FacturaUpdate {
  proveedor: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaLimitePago: string | null;
  valorTotal: string;
  moneda: string;
  numeroCliente: string | null;
}

export interface FacturaFilters {
  page?: number;
  pageSize?: number;
  proveedor?: string;
  fechaDesde?: string;
  fechaHasta?: string;

  }

