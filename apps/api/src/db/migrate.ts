import { loadDatabaseConfig } from '../config.js';
import { openDatabase, runMigrations } from './client.js';

const config = loadDatabaseConfig();
const { db, close } = openDatabase(config.DATABASE_PATH);

runMigrations(db);
close();

console.log(`Migrations applied to ${config.DATABASE_PATH}`);
