import type { DateRangeFilters, InvoiceSummary } from '../domain/invoice';
import type {InvoiceRepository} from '../ports/invoice.repository';

export class ReportService {
    constructor(private readonly invoiceRepository: InvoiceRepository) {}

    async summary(filters: DateRangeFilters): Promise<InvoiceSummary> {
        return this.invoiceRepository.summary(filters);
    }
}