import { createDb } from './db';
import { createApp } from './app';

const DB_PATH = process.env.DB_PATH || 'data/healthcare.db';
const PORT = Number(process.env.API_PORT || 4001);

const db = createDb(DB_PATH);
const app = createApp(db);

app.listen(PORT, () => {
  console.log(`[api] SQLite-backed API listening on http://localhost:${PORT} (db: ${DB_PATH})`);
});
