import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase, runMigrations } from './db/client.js';

const config = loadConfig();
const { db, close } = openDatabase(config.DATABASE_PATH);
runMigrations(db);

const app = await buildApp({
  db,
  corsOrigins: config.CORS_ORIGINS,
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
