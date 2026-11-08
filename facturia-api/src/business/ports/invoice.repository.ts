/**
 * Page<factura> represents a paginated list of invoices
 * InvoiceFilters represents the filters that can be applied when listing invoices
 */
import type { ExtractedInvoice, Factura,InvoiceData,InvoiceFilters,Page , DateRangeFilters,InvoiceSummary} from '../domain/invoice';

export interface NewDocument {
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  rutaAlmacenamiento: string;
  hashSha256: string; //Avoid document will be duplicated or corrupted
  respuestaLlm: unknown;
  modeloLlm: string;
}

export interface CreateInvoiceInput {
  invoice: ExtractedInvoice;
  proveedorNormalizado: string;
  document: NewDocument;
}

export interface UpdateInvoiceInput {
  invoice:InvoiceData,
  proveedorNormalizado: string;
}

export interface InvoiceRepository {
  // excludeId lets an invoice keep its own number when it's update
  existsActive(
    proveedorNormalizado: string, 
    numeroFactura: string,
    excludeId?: string
  ): Promise<boolean>; 

  // Creates or reuses the provider, then saves document and invoice in ONE transaction
  createWithDocument(input: CreateInvoiceInput): Promise<Factura>;

  // Added in #5: list, findById, update, softDelete. Added in #6: summary.
  list(filters:InvoiceFilters): Promise<Page<Factura>>;

  // Finds an active (not deleted) invoice by its ID
  findActiveById(id: string): Promise<Factura | null>;
  // Updates an active (not deleted) invoice by its ID
  update(id: string, input: UpdateInvoiceInput): Promise<Factura>;

  // Soft deletes an active (not deleted) invoice by its ID
  softDelete(id: string): Promise<void>;

  //Returns a summary of invoices based on the provided date range filters
  summary(filters: DateRangeFilters): Promise<InvoiceSummary>;
}