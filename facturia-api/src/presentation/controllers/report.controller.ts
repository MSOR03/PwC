import type { Request, Response } from 'express';
import type { ReportService } from '../../business/services/report.service';
import type { SummaryQuery } from '../schemas/invoice.schema';

export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    summary = async (_req: Request, res: Response) => {
        const query: SummaryQuery = _req.query as SummaryQuery;
        res.json(await this.reportService.summary(query));
    }

}
