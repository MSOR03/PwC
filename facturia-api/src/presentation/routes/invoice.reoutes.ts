

import { Router } from 'express';
import type {InvoiceController} from '../controllers/invoice.controller';
import {uploadInvoiceFile} from '../middlewares/upload.middleware';

export function invoiceRoutes(controller:InvoiceController){
    const router = Router();

    router.post('/api/facturas', uploadInvoiceFile, controller.create);

    // issue #5: GET/, GET/:id, PUT /:id , DELETE /:id
    // issue #6: GET /reportes/resumen (registered BEFORE /:id)
    return router;
}