/**
 * adminAuth.ts — single-admin auth (§23).
 * - Credential: `admin` + password, stored only as SHA-256 hex in company.json.
 * - Compare via crypto.subtle on UTF-8 bytes, constant-time string compare.
 * - Session token in sessionStorage (azt:session): 12h absolute, 60m idle.
 * - 5 failures → 60s lockout, persisted so reload doesn't reset it.
 * - requireAdmin() gates every admin route; redirect to login?next=.
 */
import { COMPANY } from '../data/company';
import { constantTimeEqual, sha256Hex } from './hash';
import { KEYS } from './store';

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h absolute
export const IDLE_TTL_MS = 60 * 60 * 1000; // 60m idle
export const LOCKOUT_FAILS = 5;
export const LOCKOUT_MS = 60 * 1000;

interface Session {
  token: string;
  expiresAt: number;
  lastActivity: number;
}

interface Lockout {
  fails: number;
  until: number;
}

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function getLockout(): Lockout | null {
  const raw = safeGet(KEYS.lockout);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Lockout;
  } catch {
    return null;
  }
}

export function remainingLockout(): number {
  const l = getLockout();
  if (!l) return 0;
  return Math.max(0, l.until - Date.now());
}

export interface LoginResult {
  ok: boolean;
  lockedOutMs?: number;
  reason?: 'locked' | 'credentials';
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const lock = getLockout();
  if (lock && lock.until > Date.now()) {
    return { ok: false, lockedOutMs: lock.until - Date.now(), reason: 'locked' };
  }

  const okUser = constantTimeEqual(username, COMPANY.admin.username);
  const hash = await sha256Hex(password);
  const okPass = constantTimeEqual(hash, COMPANY.admin.passwordHash);

  if (!okUser || !okPass) {
    const fails = (lock?.fails ?? 0) + 1;
    const until = fails >= LOCKOUT_FAILS ? Date.now() + LOCKOUT_MS : 0;
    safeSet(KEYS.lockout, JSON.stringify({ fails, until }));
    return { ok: false, reason: 'credentials' };
  }

  safeRemove(KEYS.lockout);
  const session: Session = {
    token: `${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`,
    expiresAt: Date.now() + SESSION_TTL_MS,
    lastActivity: Date.now(),
  };
  safeSet(KEYS.session, JSON.stringify(session));
  return { ok: true };
}

export function getSession(): Session | null {
  const raw = safeGet(KEYS.session);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    if (s.expiresAt < Date.now()) {
      safeRemove(KEYS.session);
      return null;
    }
    if (Date.now() - s.lastActivity > IDLE_TTL_MS) {
      safeRemove(KEYS.session);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

/** Refresh idle timer on activity (§23: 60m idle). */
export function touchSession(): void {
  const s = getSession();
  if (!s) return;
  s.lastActivity = Date.now();
  safeSet(KEYS.session, JSON.stringify(s));
}

export function logout(): void {
  safeRemove(KEYS.session);
}

export function isAuthed(): boolean {
  return getSession() !== null;
}

/** Hash a new password and return the exact JSON to commit (§23). */
export async function hashForCommit(password: string): Promise<string> {
  const h = await sha256Hex(password);
  return JSON.stringify({ admin: { username: 'admin', passwordHash: h } }, null, 2);
}
