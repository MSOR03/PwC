export interface SummaryRow {
    proveedorId: string;
    proveedor: string;
    mes: string;
    moneda: string;
    cantidad: string;
    total: string;
}

export interface CurrencyTotal {
    moneda: string;
    cantidad: number;
    total: string;
}

export interface InvoiceSummary {
    data: SummaryRow[];
    totalsByCurrency: CurrencyTotal[];
}

export interface DateRange {
    fechaDesde?: string;
    fechaHasta?: string;
}