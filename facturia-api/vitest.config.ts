import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    // Fixed environment so tests never depend on a local .env (CI has none).
    // dotenv does not override variables that are already set.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      UPLOAD_DIR: 'uploads-test',
      LLM_PROVIDER: 'fake',
    },
  },
});
