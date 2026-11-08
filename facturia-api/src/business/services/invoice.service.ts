import { createHash } from 'node:crypto';
import { type FileInput, validateFile } from '../domain/file';
import { normalizeProviderName } from '../domain/provider';
import type { FileStorage } from '../ports/file.storage';
import type { InvoiceRepository } from '../ports/invoice.repository';
import type { ExtractionService } from './extraction.service';

import { DuplicateInvoiceError, ExtractionError, NotFoundError, ValidationError } from '../domain/errors'
import type { Factura, InvoiceData, InvoiceFilters, Page } from '../domain/invoice';

export class InvoiceService {
  constructor(
    private readonly repository: InvoiceRepository,
    private readonly extraction: ExtractionService,
    private readonly storage: FileStorage,
  ) { }

  async register(file: FileInput): Promise<Factura> {
    // 1. File rules BEFORE calling the LLM (400 / 413 / 415)
    const mimeType = validateFile(file);

    // 2. Extraction and validation of the LLM output (422 / 502)
    const { data, rawResponse, model } = await this.extraction.extract(file.content, mimeType);

    // 3. Duplicate check by normalized provider + invoice number (409)
    const proveedorNormalizado = normalizeProviderName(data.proveedor);
    if (!proveedorNormalizado) {
      throw new ExtractionError('No se pudo identificar el proveedor de la factura');
    }
    if (await this.repository.existsActive(proveedorNormalizado, data.numeroFactura)) {
      throw new DuplicateInvoiceError(
        `Ya existe la factura ${data.numeroFactura} del proveedor ${data.proveedor}`,
      );
    }

    // 4. Save the file, then the database transaction
    const storedPath = await this.storage.save(file.content, file.originalName);

    try {
      return await this.repository.createWithDocument({
        invoice: data,
        proveedorNormalizado,
        document: {
          nombreOriginal: file.originalName.slice(0, 255),
          mimeType,
          tamanoBytes: file.sizeBytes,
          rutaAlmacenamiento: storedPath,
          hashSha256: createHash('sha256').update(file.content).digest('hex'),
          respuestaLlm: rawResponse,
          modeloLlm: model,
        },
      });
    } catch (error) {
      
      // Compensating action: no orphan file if the transaction fails
      await this.storage.delete(storedPath);
      throw error;
    }
  }

  async list(filters: InvoiceFilters): Promise<Page<Factura>> {
    const proveedor = filters.proveedor ? normalizeProviderName(filters.proveedor) : '';
    return this.repository.list({
      ...filters,
      proveedor: proveedor || undefined
    });
  }

  // Get an active invoice by its ID, throw if not found
  async getById(id: string): Promise<Factura | null> {

    const factura = await this.repository.findActiveById(id);
    if (!factura) {
      throw new NotFoundError(`Invoice was not found: ${id}`);
    }
    return factura;

  }

  // Update an active invoice by its ID, throw if not found
  async update(id: string, data: InvoiceData): Promise<Factura> {
    await this.getById(id);

    
    // Validate that the due date is not earlier than the issue date
    if (data.fechaLimitePago && data.fechaLimitePago < data.fechaEmision) {
      throw new ValidationError('The due date cannot be earlier than the issue date', [
        { field: 'fechaLimitePago', message: 'Must be later than the issue date' }
      ]);
    }
    
    // Normalize the provider name and validate it
    const proveedorNormalizado = normalizeProviderName(data.proveedor);
    if (!proveedorNormalizado) {
      throw new ValidationError('Invalid provider name', [
        { field: 'proveedor', message: 'Could not normalize provider name' }
      ]);
    }

    // Check for duplicate active invoice for the same provider and invoice number
    if (await this.repository.existsActive(proveedorNormalizado, data.numeroFactura, id)) {
      throw new DuplicateInvoiceError(
        `Invoice ${data.numeroFactura} for provider ${data.proveedor} already exists`
      );
    }

    return this.repository.update(id, {
      invoice: data,
      proveedorNormalizado

    });
  }
  // Soft delete an active invoice by its ID, throw if not found
  async remove (id: string): Promise<void> {
    await this.getById(id);
    await this.repository.softDelete(id);
  }

}