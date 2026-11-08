import type { ExtractedInvoice, Factura } from '../domain/invoice';

export interface NewDocument {
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  rutaAlmacenamiento: string;
  hashSha256: string;
  respuestaLlm: unknown;
  modeloLlm: string;
}

export interface CreateInvoiceInput {
  invoice: ExtractedInvoice;
  proveedorNormalizado: string;
  document: NewDocument;
}

export interface InvoiceRepository {
  // true if an active (not deleted) invoice exists for that provider + number
  existsActive(proveedorNormalizado: string, numeroFactura: string): Promise<boolean>;

  // Creates or reuses the provider, then saves document and invoice in ONE transaction
  createWithDocument(input: CreateInvoiceInput): Promise<Factura>;

  // Added in #5: list, findById, update, softDelete. Added in #6: summary.
}