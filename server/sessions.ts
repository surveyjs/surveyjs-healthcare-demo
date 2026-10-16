import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { HealthcareDb } from './db';

/** Cookie that ties a browser to its own demo database. */
export const SESSION_COOKIE = 'hc_demo_session';

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface SessionStoreOptions {
  /** Creates a freshly seeded database for a new visitor. */
  createDb: () => HealthcareDb;
  /** Sessions idle longer than this are dropped (default 2 hours). */
  idleTtlMs?: number;
  /** The least recently used session is dropped beyond this many (default 200). */
  maxSessions?: number;
  now?: () => number;
}

export interface SessionStore {
  /** The visitor's database; unknown or expired ids get a new seeded one. */
  get(id: string): HealthcareDb;
  size(): number;
  closeAll(): void;
}

/**
 * Keeps one database per visitor so that changes made in one browser (custom
 * forms, patients, visits) never show up in another visitor's demo.
 */
export function createSessionStore({
  createDb,
  idleTtlMs = 2 * 60 * 60 * 1000,
  maxSessions = 200,
  now = Date.now,
}: SessionStoreOptions): SessionStore {
  // Map order is recency order: an accessed session is moved to the end.
  // `returned` marks visitors whose cookie came back; one-off clients (probes,
  // crawlers) never set it and are evicted before returning visitors.
  const sessions = new Map<string, { db: HealthcareDb; lastUsed: number; returned: boolean }>();
  const leastValuable = () => {
    for (const [id, session] of sessions) if (!session.returned) return id;
    return sessions.keys().next().value!;
  };

  const drop = (id: string) => {
    sessions.get(id)?.db.close();
    sessions.delete(id);
  };

  return {
    get(id) {
      const time = now();
      for (const [key, session] of sessions) {
        if (time - session.lastUsed > idleTtlMs) drop(key);
      }
      let session = sessions.get(id);
      if (session) {
        sessions.delete(id);
        session.returned = true;
      } else {
        while (sessions.size >= maxSessions) drop(leastValuable());
        session = { db: createDb(), lastUsed: time, returned: false };
      }
      session.lastUsed = time;
      sessions.set(id, session);
      return session.db;
    },
    size: () => sessions.size,
    closeAll() {
      for (const id of [...sessions.keys()]) drop(id);
    },
  };
}

function readSessionCookie(header: string | undefined): string | undefined {
  for (const part of header?.split(';') ?? []) {
    const [name, value] = part.trim().split('=');
    if (name === SESSION_COOKIE && value && SESSION_ID.test(value)) return value;
  }
  return undefined;
}

/** Resolves the visitor's database into `res.locals.db`, issuing a session cookie on the first request. */
export function sessionMiddleware(store: SessionStore): RequestHandler {
  return (req, res, next) => {
    let id = readSessionCookie(req.headers.cookie);
    if (!id) {
      id = randomUUID();
      res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax`);
    }
    res.locals.db = store.get(id);
    next();
  };
}
