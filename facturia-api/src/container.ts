import {env} from './config/env';
import type {LlmClient} from './business/ports/llm.client';
import {ExtractionService} from './business/services/extraction.service';
import {InvoiceService} from './business/services/invoice.service';
import {FakeLlmClient} from './data/llm/fake-llm.client';
import { GeminiLlmClient } from './data/llm/gemini-llm.client';
import { prisma } from './data/prisma';
import {PrismaInvoiceRepository} from './data/repositories/prisma-invoice.repository';
import {LocalFileStorage} from './data/storage/local-file.storage'
import {InvoiceController} from './presentation/controllers/invoice.controller';
import { ReportController } from './presentation/controllers/report.controller';
import { ReportService } from './business/services/report.service';
// Composition root: the only place that knows the concrete implementations.
// Repositories, the LLM adapter and the services are wired here in issues #4 and #5.

export function buildLlmClient():LlmClient {
  if(env.LLM_PROVIDER === 'fake') return new FakeLlmClient();
  return new GeminiLlmClient(env.LLM_API_KEY!,env.LLM_MODEL,env.LLM_TIMEOUT_MS);
}

export function buildContainer() {

  //data layer adapters
  const invoiceRepository = new PrismaInvoiceRepository(prisma);
  const fileStorage = new LocalFileStorage(env.UPLOAD_DIR);
  const llmClient = buildLlmClient();

  //business layer wiring
  const extractionService = new ExtractionService(llmClient);
  const invoiceService = new InvoiceService(invoiceRepository, extractionService, fileStorage);
   const reportService = new ReportService(invoiceRepository);
  //presentation layer wiring
  
  const invoiceController = new InvoiceController(invoiceService);
  const reportController = new ReportController(reportService);

  return {
    prisma,
    invoiceController,
    reportController
  };
}

export type Container = ReturnType<typeof buildContainer>;




