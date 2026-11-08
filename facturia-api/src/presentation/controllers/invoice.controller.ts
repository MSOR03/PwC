import type { Request, Response } from 'express';
import {ValidationError} from '../../business/domain/errors';
import { InvoiceService } from '../../business/services/invoice.service';

export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService){}

    create = async (req:Request,res:Response)=>{
        if(!req.file){
            throw new ValidationError('File is required');
        }

        const factura=await this.invoiceService.register({
            content: req.file.buffer,
            //multer decodes file names as latin1, 
            originalName: req.file.originalname,
            sizeBytes: req.file.size
        });

        res.status(201).location(`/api/facturas/${factura.id}`).json(factura);
    }

}
 