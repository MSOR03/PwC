import 'dotenv/config'
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1,'DATABASE_URL is required'),
    LLM_PROVIDER: z.enum(['gemini', 'fake']).default('gemini'),
    LLM_API_KEY: z.string().optional(),
    LLM_MODEL: z.string().min(1).default('gemini-3.5-flash'),
    LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
})

  .superRefine((env, ctx) => {
    if (env.LLM_PROVIDER === 'gemini' && !env.LLM_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['LLM_API_KEY'],
        message: 'LLM_API_KEY is required when LLM_PROVIDER=gemini',
      });
    }
  });

const parsed= envSchema.safeParse(process.env)

if (!parsed.success) {
    const problems=parsed.error.issues
    .map((issue)=>`${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
    console.error(`Environment validation failed:\n${problems}`);
    process.exit(1);
}

export const env = parsed.data;