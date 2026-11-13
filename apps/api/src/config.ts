import { z } from 'zod';
import { isPasswordHash } from './modules/auth/password.js';

const databaseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_PATH: z.string().min(1).default('./data/salary.db'),
});

const serverSchema = databaseSchema.extend({
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  AUTH_USERNAME: z.string().trim().min(1, 'Set the HR Manager username'),
  AUTH_PASSWORD_HASH: z
    .string()
    .refine(isPasswordHash, 'Generate it with: pnpm --filter @salary/api auth:hash-password'),
  SESSION_SECRET: z.string().min(32, 'Use at least 32 random characters'),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(8),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
export type AppConfig = z.infer<typeof serverSchema>;

/** Everything the HTTP server needs, including auth secrets. Fails fast if anything is missing. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return parse(serverSchema, env);
}

/** Just enough for scripts that only touch the database (migrate, seed). */
export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  return parse(databaseSchema, env);
}

function parse<T extends z.ZodType>(schema: T, env: NodeJS.ProcessEnv): z.infer<T> {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
