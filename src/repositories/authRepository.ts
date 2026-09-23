import { AuthUser } from '../types/auth';

const STORAGE_KEY = 'hc-auth-user';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export const authRepository = {
  async login(username: string, password: string): Promise<AuthUser> {
    return request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /** "Keep me signed in" uses localStorage; otherwise the session ends with the tab. */
  storeUser(user: AuthUser, remember: boolean): void {
    const target = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    target.setItem(STORAGE_KEY, JSON.stringify(user));
    other.removeItem(STORAGE_KEY);
  },

  getStoredUser(): AuthUser | null {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  clearStoredUser(): void {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
  },
};
