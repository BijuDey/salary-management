import { loadConfig } from '../config.js';
import { openDatabase, runMigrations } from './client.js';

const config = loadConfig();
const { db, close } = openDatabase(config.DATABASE_PATH);

runMigrations(db);
close();

console.log(`Migrations applied to ${config.DATABASE_PATH}`);
