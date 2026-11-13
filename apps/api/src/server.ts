import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase, runMigrations } from './db/client.js';

const config = loadConfig();
const { db, close } = openDatabase(config.DATABASE_PATH);
runMigrations(db);

const app = await buildApp({
  db,
  auth: {
    username: config.AUTH_USERNAME,
    passwordHash: config.AUTH_PASSWORD_HASH,
    sessionSecret: config.SESSION_SECRET,
    sessionTtlMs: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
    secureCookies: config.NODE_ENV === 'production',
  },
  logger: config.NODE_ENV !== 'test',
});

const shutdown = async (signal: string) => {
  app.log.info(`${signal} received, shutting down`);
  await app.close();
  close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ port: config.PORT, host: config.HOST });
