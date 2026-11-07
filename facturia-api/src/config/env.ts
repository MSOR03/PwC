import 'dotenv/config'
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1,'DATABASE_URL is required'),

})

const parsed= envSchema.safeParse(process.env)

if (!parsed.success) {
    const problems=parsed.error.issues
    .map((issue)=>`${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
    console.error(`Environment validation failed:\n${problems}`);
    process.exit(1);
}

export const env = parsed.data;