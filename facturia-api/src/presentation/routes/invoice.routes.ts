

import { Router } from 'express';
import type { InvoiceController } from '../controllers/invoice.controller';
import type { ReportController } from '../controllers/report.controller';
import { uploadInvoiceFile } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';
import { idParamsSchema, listInvoiceQuerySchema, summaryQuerySchema, updateInvoiceBodySchema } from '../schemas/invoice.schema';

export function invoiceRoutes(controller: InvoiceController, reportController: ReportController) {
    const router = Router();

    // Create a new invoice
    router.post('/', uploadInvoiceFile, controller.create);

    // List all invoices
    router.get('/', validate({ query: listInvoiceQuerySchema }), controller.list);

    // Get the summary report
    router.get('/reportes/resumen', validate({ query: summaryQuerySchema }), reportController.summary);

    // Get an invoice by ID
    router.get('/:id', validate({ params: idParamsSchema }), controller.getById);

    // Update an invoice by ID
    router.put('/:id', validate({ params: idParamsSchema, body: updateInvoiceBodySchema }), controller.update);

    // Delete an invoice by ID
    router.delete('/:id', validate({ params: idParamsSchema }), controller.remove);


    return router;
}