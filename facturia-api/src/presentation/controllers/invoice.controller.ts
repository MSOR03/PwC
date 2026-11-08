import type { Request, Response } from 'express';
import { ValidationError } from '../../business/domain/errors';
import { InvoiceService } from '../../business/services/invoice.service';
import type { IdParams, ListInvoicesQuery, UpdateInvoiceBody } from '../schemas/invoice.schema';

export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) { }

    // Handles the creation of a new invoice
    create = async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ValidationError('File is required');
        }

        const factura = await this.invoiceService.register({
            content: req.file.buffer,
            //multer decodes file names as latin1, 
            originalName: req.file.originalname,
            sizeBytes: req.file.size
        });

        res.status(201).location(`/api/facturas/${factura.id}`).json(factura);
    }

    // Handles listing invoices based on query parameters
    list = async (_req: Request, res: Response) => {
        const query = res.locals.query as ListInvoicesQuery;
        res.json(await this.invoiceService.list(query));
    };

    // Handles fetching a single invoice by its ID
    getById = async (req: Request, res: Response) => {
        const id = req.params as IdParams;
        res.json(await this.invoiceService.getById(id.id));
    };

    // Handles updating an existing invoice by its ID
    update = async (req: Request, res: Response) => {
        const { id } = req.params as IdParams;
        res.json(await this.invoiceService.update(id, req.body as UpdateInvoiceBody));
    };

    // Handles removing an invoice by its ID
    remove = async (req: Request, res: Response) => {
        const id = req.params as IdParams;
        await this.invoiceService.remove(id.id);
        res.status(204).send();
    };
}