import type {DateRange, InvoiceSummary} from '../models/resumen';
import {httpClient} from './httpClient';

export const reportesService={
    async getResumen(range: DateRange): Promise<InvoiceSummary> {
        const {data}= await httpClient.get<InvoiceSummary>('/facturas/reportes/resumen', 
            { params: range }
        );
        return data;
    }
}