/**
 * imagegen.ts — provider abstraction (§21.3, §22).
 * pollinations (keyless, default) · venice (BYO key) · manual (URL paste).
 * Provider config lives in localStorage azt:v2:gen — never committed.
 * Keys masked to last 4. 401/429 surface the status and stop the queue.
 * Blob cache in IndexedDB azt:v3:gencache keyed by sha256(provider|model|prompt|seed|w|h),
 * LRU eviction at 150MB.
 */

export type ProviderId = 'pollinations' | 'venice' | 'manual';

export interface GenSettings {
  provider: ProviderId;
  key: string; // venice key, masked on read
  model: string;
  steps: number;
}

export const GEN_KEY = 'azt:v2:gen';
export const GEN_CACHE_DB = 'azt:v3:gencache';
export const GEN_CACHE_CAP_BYTES = 150 * 1024 * 1024;

const DEFAULT_SETTINGS: GenSettings = {
  provider: 'pollinations',
  key: '',
  model: 'flux',
  steps: 30,
};

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 4) return '••••';
  return `${key.slice(0, -4).replace(/./g, '•')}${key.slice(-4)}`;
}

export function loadGenSettings(): GenSettings {
  try {
    const raw = localStorage.getItem(GEN_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GenSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGenSettings(s: GenSettings): void {
  try {
    localStorage.setItem(GEN_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export class GenError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface GenRequest {
  prompt: string;
  negative: string;
  width: number;
  height: number;
  seed: number;
  steps?: number;
}

async function generatePollinations(req: GenRequest, signal: AbortSignal): Promise<Blob> {
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(req.prompt)}` +
    `?width=${req.width}&height=${req.height}&seed=${req.seed}&model=flux&nologo=true`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new GenError(`pollinations ${res.status}`, res.status);
  return res.blob();
}

async function generateVenice(req: GenRequest, signal: AbortSignal, key: string, model: string, steps: number): Promise<Blob> {
  const res = await fetch('https://api.venice.ai/api/v1/image/generate', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt: req.prompt,
      negative_prompt: req.negative,
      width: req.width,
      height: req.height,
      steps,
      seed: req.seed,
      format: 'webp',
    }),
  });
  if (!res.ok) throw new GenError(`venice ${res.status}`, res.status);
  const data = (await res.json()) as { data?: Array<{ image_base64?: string }> };
  const b64 = data.data?.[0]?.image_base64;
  if (!b64) throw new GenError('venice: empty response', 500);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'image/webp' });
}

/** One attempt, 25s timeout, one retry (§22.5). */
export async function generateImage(req: GenRequest, settings: GenSettings): Promise<Blob> {
  const timeout = (ms: number) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    return { signal: c.signal, clear: () => clearTimeout(t) };
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const { signal, clear } = timeout(25_000);
    try {
      const blob =
        settings.provider === 'venice'
          ? await generateVenice(req, signal, settings.key, settings.model, req.steps ?? settings.steps)
          : settings.provider === 'manual'
            ? await fetch(settings.key, { signal }).then((r) => {
                if (!r.ok) throw new GenError(`manual ${r.status}`, r.status);
                return r.blob();
              })
            : await generatePollinations(req, signal);
      clear();
      return blob;
    } catch (err) {
      clear();
      if (err instanceof GenError && (err.status === 401 || err.status === 429)) {
        throw err; // surface, don't retry blindly
      }
      if (attempt === 1) throw err instanceof Error ? err : new Error(String(err));
    }
  }
  throw new Error('unreachable');
}

/* ---------- IndexedDB cache ---------- */

interface CacheEntry {
  blob: Blob;
  bytes: number;
  at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openCache(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(GEN_CACHE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('blobs')) {
        db.createObjectStore('blobs', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function cacheKey(req: GenRequest, settings: GenSettings): Promise<string> {
  const { sha256Hex } = await import('./hash');
  return sha256Hex(`${settings.provider}|${settings.model}|${req.prompt}|${req.seed}|${req.width}x${req.height}`);
}

export async function cacheGet(key: string): Promise<Blob | null> {
  try {
    const db = await openCache();
    return await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction('blobs', 'readonly');
      const req = tx.objectStore('blobs').get(key);
      req.onsuccess = () => resolve((req.result as CacheEntry | undefined)?.blob ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cachePut(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openCache();
    await new Promise<void>((resolve) => {
      const tx = db.transaction('blobs', 'readwrite');
      tx.objectStore('blobs').put({ key, blob, bytes: blob.size, at: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    void evictIfOver(db);
  } catch {
    /* cache failure is non-fatal */
  }
}

async function evictIfOver(db: IDBDatabase): Promise<void> {
  try {
    const all = await new Promise<Array<{ key: string; bytes: number; at: number }>>((resolve) => {
      const tx = db.transaction('blobs', 'readonly');
      const req = tx.objectStore('blobs').getAll();
      req.onsuccess = () => resolve(req.result as Array<{ key: string; bytes: number; at: number }>);
      req.onerror = () => resolve([]);
    });
    let total = all.reduce((s, e) => s + e.bytes, 0);
    if (total <= GEN_CACHE_CAP_BYTES) return;
    all.sort((a, b) => a.at - b.at);
    for (const e of all) {
      if (total <= GEN_CACHE_CAP_BYTES) break;
      await new Promise<void>((resolve) => {
        const tx = db.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').delete(e.key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      total -= e.bytes;
    }
  } catch {
    /* ignore */
  }
}

/** Meter for the admin UI (§22.6 GenCacheMeter). */
export async function cacheUsage(): Promise<{ bytes: number; cap: number }> {
  try {
    const db = await openCache();
    const all = await new Promise<Array<{ bytes: number }>>((resolve) => {
      const tx = db.transaction('blobs', 'readonly');
      const req = tx.objectStore('blobs').getAll();
      req.onsuccess = () => resolve(req.result as Array<{ bytes: number }>);
      req.onerror = () => resolve([]);
    });
    return { bytes: all.reduce((s, e) => s + e.bytes, 0), cap: GEN_CACHE_CAP_BYTES };
  } catch {
    return { bytes: 0, cap: GEN_CACHE_CAP_BYTES };
  }
}

export async function generateWithCache(req: GenRequest, settings: GenSettings): Promise<Blob> {
  const key = await cacheKey(req, settings);
  const hit = await cacheGet(key);
  if (hit) return hit;
  const blob = await generateImage(req, settings);
  await cachePut(key, blob);
  return blob;
}
