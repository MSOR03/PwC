import express from "express";
import type { Container } from './container';
import { errorHandler } from "./presentation/middlewares/errorHandler.middleware";
import { notFound } from "./presentation/middlewares/notFound.middleware";
import { invoiceRoutes } from "./presentation/routes/invoice.routes";
import cors from 'cors';
import { env } from "./config/env";


export function createApp(container: Container) {
    const app = express();

    // Hide the header that reveals the technology stack
    app.disable('x-powered-by')

    if (env.CORS_ORIGIN) {
        app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
    }

    //limit the size of incoming JSON payloads to 10MB
    app.use(express.json({ limit: '10mb' }));

    app.get('/api/health', async (_req, res) => {
        await container.prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'up' });
    });

    app.use(
        '/api/facturas',
        invoiceRoutes(container.invoiceController, container.reportController)
    );
    //If a route is not found, use the notFound middleware
    app.use(notFound);

    //the errors are redirected to the errorHandler middleware
    app.use(errorHandler);

    return app;

}