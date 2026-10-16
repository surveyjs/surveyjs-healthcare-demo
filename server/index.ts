import { createDb } from './db';
import { createApp } from './app';
import { createSessionStore } from './sessions';

const DB_PATH = process.env.DB_PATH || 'data/healthcare.db';
const PORT = Number(process.env.API_PORT || 4001);
// Sandbox mode (default): every visitor gets a private, freshly seeded in-memory database,
// so one visitor's edits never appear in another visitor's demo. DEMO_SANDBOX=off shares DB_PATH.
const SANDBOX = process.env.DEMO_SANDBOX !== 'off';

// Worst-case sandbox memory is bounded: MAX_SANDBOXES x SANDBOX_BYTES (a seeded sandbox uses ~0.3 MB).
const SANDBOX_BYTES = 8 * 1024 * 1024;
const MAX_SANDBOXES = 100;

const app = SANDBOX
  ? createApp(
      createSessionStore({
        createDb: () => createDb(':memory:', { maxBytes: SANDBOX_BYTES }),
        maxSessions: MAX_SANDBOXES,
      }),
    )
  : createApp(createDb(DB_PATH));

app.listen(PORT, () => {
  const storage = SANDBOX ? 'per-visitor in-memory sandboxes' : `shared db: ${DB_PATH}`;
  console.log(`[api] SQLite-backed API listening on http://localhost:${PORT} (${storage})`);
});
