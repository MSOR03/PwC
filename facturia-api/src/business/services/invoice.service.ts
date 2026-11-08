import { createHash } from 'node:crypto';
import { DuplicateInvoiceError, ExtractionError } from '../domain/errors';
import { type FileInput, validateFile } from '../domain/file';
import type { Factura } from '../domain/invoice';
import { normalizeProviderName } from '../domain/provider';
import type { FileStorage } from '../ports/file.storage';
import type { InvoiceRepository } from '../ports/invoice.repository';
import type { ExtractionService } from './extraction.service';

export class InvoiceService {
  constructor(
    private readonly repository: InvoiceRepository,
    private readonly extraction: ExtractionService,
    private readonly storage: FileStorage,
  ) {}

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
}