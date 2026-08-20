import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Provide a dummy DATABASE_URL so importing db/database.ts does not
    // process.exit(1). The Pool is lazy and never actually connects in unit tests.
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      DATABASE_SSL: 'false',
      NODE_ENV: 'test',
    },
  },
})
