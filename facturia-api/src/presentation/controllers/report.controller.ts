import type { Request, Response } from 'express';
import type { ReportService } from '../../business/services/report.service';
import type { SummaryQuery } from '../schemas/invoice.schema';

export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    // Uses the query already parsed by the validate middleware (empty values removed, dates checked)
    summary = async (_req: Request, res: Response) => {
        const query = res.locals.query as SummaryQuery;
        res.json(await this.reportService.summary(query));
    }

}
