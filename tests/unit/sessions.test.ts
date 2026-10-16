import { describe, it, expect, vi } from 'vitest';
import { createDb } from '../../server/db';
import { createSessionStore } from '../../server/sessions';
import { INITIAL_PATIENTS } from '../../src/data/initialData';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

function storeWithClock(options: { idleTtlMs?: number; maxSessions?: number } = {}) {
  let time = 0;
  const create = vi.fn(() => createDb(':memory:'));
  const store = createSessionStore({ createDb: create, now: () => time, ...options });
  return { store, create, advance: (ms: number) => (time += ms) };
}

describe('session store', () => {
  it('same id returns the same db', () => {
    const { store } = storeWithClock();
    expect(store.get(A)).toBe(store.get(A));
    store.closeAll();
  });

  it('different ids are isolated', () => {
    const { store } = storeWithClock();
    store.get(A).saveFormSchema('patient-search', { title: 'Visitor A' });
    expect(store.get(A).listFormSchemas()).toHaveProperty('patient-search');
    expect(store.get(B).listFormSchemas()).toEqual({});
    store.closeAll();
  });

  it('unknown id creates a seeded db', () => {
    const { store } = storeWithClock();
    expect(store.get(A).listPatients()).toHaveLength(INITIAL_PATIENTS.length);
    expect(store.size()).toBe(1);
    store.closeAll();
  });

  it('idle sessions are dropped and closed', () => {
    const { store, advance } = storeWithClock({ idleTtlMs: 1000 });
    const first = store.get(A);
    first.saveFormSchema('patient-search', { title: 'Visitor A' });
    advance(1001);
    const second = store.get(A);
    expect(second).not.toBe(first);
    expect(second.listFormSchemas()).toEqual({});
    expect(() => first.listFormSchemas()).toThrow();
    store.closeAll();
  });

  it('evicts the least recently used session beyond maxSessions', () => {
    const { store, advance, create } = storeWithClock({ maxSessions: 2 });
    const a = store.get(A);
    advance(1);
    store.get(B);
    advance(1);
    store.get(A); // A is now more recent than B
    advance(1);
    store.get(C);
    expect(store.size()).toBe(2);
    expect(store.get(A)).toBe(a);
    expect(create).toHaveBeenCalledTimes(3);
    store.get(B);
    expect(create).toHaveBeenCalledTimes(4);
    store.closeAll();
  });

  it('evicts visitors who never came back before returning visitors', () => {
    const { store, advance } = storeWithClock({ maxSessions: 2 });
    const a = store.get(A);
    advance(1);
    store.get(A); // A came back: an established visitor
    advance(1);
    const b = store.get(B); // B is newer but has made a single request (e.g. a probe)
    advance(1);
    store.get(C);
    expect(store.get(A)).toBe(a);
    expect(store.size()).toBe(2);
    expect(store.get(B)).not.toBe(b);
    store.closeAll();
  });
});
