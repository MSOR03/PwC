import { prisma } from './data/prisma';

// Composition root: the only place that knows the concrete implementations.
// Repositories, the LLM adapter and the services are wired here in issues #4 and #5.
export function buildContainer() {
  return { prisma };
}

export type Container = ReturnType<typeof buildContainer>;

