import { createApp } from "./app";
import {env} from './config/env';
import { buildContainer } from "./container";

const container = buildContainer();

const server = createApp(container).listen(env.PORT,()=>{
    console.log(`facturia-api listening on http://localhost:${env.PORT}`)
}) 

const shutdown = () => {

    server.close(async () => {
        await container.prisma.$disconnect();
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

