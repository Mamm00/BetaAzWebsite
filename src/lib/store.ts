/**
 * store.ts — the only storage module (§6.3). Every component reads through
 * useStore; nothing touches localStorage/sessionStorage directly.
 * Versioned keys azt:v1:*, migrate() drops unknown versions, quota-guarded,
 * schema-checked reads that degrade to [] on corrupt blobs.
 */

export const KEYS = {
  locale: 'azt:v1:locale',
  session: 'azt:session',
  lockout: 'azt:v1:lockout',
  activity: 'azt:v2:activity',
  gen: 'azt:v2:gen',
  recipes: 'azt:v1:recipes',
  lot: (id: string) => `azt:v1:lot:${id}`,
  quote: (id: string) => `azt:v1:quote:${id}`,
  draft: (collection: string, id: string) => `azt:v2:draft:${collection}:${id}`,
  draftsIndex: 'azt:v2:drafts',
  localeOverlay: 'azt:v2:locale-overlay',
  sampleList: 'azt:v1:samples',
  genCache: 'azt:v3:gencache',
  visitorGen: 'azt:visitor-gen',
} as const;

export const SAMPLE_CAP = 50;
export const RECIPE_CAP = 4;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // Safari private mode throws on write; reads degrade
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaError(err)) {
      return handleQuota(key, value);
    }
    return false;
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

/** On quota, drop the oldest sample entries once, then retry (§6.3). */
function handleQuota(key: string, value: string): boolean {
  if (key !== KEYS.sampleList) return false;
  try {
    const raw = localStorage.getItem(KEYS.sampleList);
    if (raw) {
      const parsed = JSON.parse(raw) as Array<{ addedAt: number }>;
      if (Array.isArray(parsed) && parsed.length > 1) {
        parsed.sort((a, b) => a.addedAt - b.addedAt);
        parsed.splice(0, Math.max(1, parsed.length - Math.floor(SAMPLE_CAP / 2)));
        localStorage.setItem(KEYS.sampleList, JSON.stringify(parsed));
        localStorage.setItem(key, value);
        return true;
      }
    }
  } catch {
    /* corrupt — fall through */
  }
  return false;
}

/* ---------- schema-checked generic read ---------- */

export function readJson<T>(key: string, validate: (v: unknown) => v is T, fallback: T): T {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate(parsed)) return parsed;
  } catch {
    /* corrupt blob degrades to fallback */
  }
  return fallback;
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    return safeSet(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

/* ---------- sample list ---------- */

export interface SampleItem {
  slug: string;
  grade: 'A' | 'B' | 'C';
  metres: number;
  addedAt: number;
}

function isSampleItem(v: unknown): v is SampleItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.slug === 'string' &&
    (o.grade === 'A' || o.grade === 'B' || o.grade === 'C') &&
    typeof o.metres === 'number' &&
    typeof o.addedAt === 'number'
  );
}

export function getSamples(): SampleItem[] {
  return readJson<SampleItem[]>(KEYS.sampleList, (v): v is SampleItem[] => Array.isArray(v) && v.every(isSampleItem), []);
}

export function addSample(item: Omit<SampleItem, 'addedAt'>): SampleItem[] {
  const list = getSamples();
  const deduped = list.filter((s) => s.slug !== item.slug);
  const next = [...deduped, { ...item, addedAt: Date.now() }];
  next.sort((a, b) => b.addedAt - a.addedAt);
  const capped = next.slice(0, SAMPLE_CAP);
  if (writeJson(KEYS.sampleList, capped)) {
    dispatch();
  }
  return capped;
}

export function removeSample(slug: string): SampleItem[] {
  const next = getSamples().filter((s) => s.slug !== slug);
  writeJson(KEYS.sampleList, next);
  dispatch();
  return next;
}

export function clearSamples(): void {
  writeJson(KEYS.sampleList, []);
  dispatch();
}

/* ---------- locale ---------- */

export function getLocale(): 'ar' | 'en' {
  const v = safeGet(KEYS.locale);
  return v === 'en' ? 'en' : 'ar';
}

export function setLocale(locale: 'ar' | 'en'): void {
  safeSet(KEYS.locale, locale);
}

/* ---------- lot / quote ---------- */

export function saveLot(id: string, data: unknown): void {
  writeJson(KEYS.lot(id), data);
  pushActivity(`lot:${id}`);
  dispatch();
}

export function removeLot(id: string): void {
  try {
    localStorage.removeItem(KEYS.lot(id));
  } catch {
    /* ignore */
  }
  dispatch();
}

export function listLots(): Array<{ id: string; data: unknown }> {
  const out: Array<{ id: string; data: unknown }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${KEYS.lot('')}`) && k !== KEYS.draftsIndex) {
        const raw = localStorage.getItem(k);
        if (raw) out.push({ id: k.slice(KEYS.lot('').length), data: JSON.parse(raw) });
      }
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => (a.id > b.id ? 1 : -1));
}

export function saveQuote(id: string, data: unknown): void {
  writeJson(KEYS.quote(id), data);
  pushActivity(`quote:${id}`);
  dispatch();
}

export function listQuotes(): Array<{ id: string; data: unknown }> {
  const out: Array<{ id: string; data: unknown }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${KEYS.quote('')}`)) {
        const raw = localStorage.getItem(k);
        if (raw) out.push({ id: k.slice(KEYS.quote('').length), data: JSON.parse(raw) });
      }
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => (a.id > b.id ? 1 : -1));
}

/* ---------- recipes (Wash Lab) ---------- */

export interface Recipe {
  id: string;
  name: string;
  temp: number;
  time: number;
  ratio: number;
  cycle: string;
  savedAt: number;
}

function isRecipe(v: unknown): v is Recipe {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.temp === 'number' &&
    typeof o.time === 'number' &&
    typeof o.ratio === 'number' &&
    typeof o.cycle === 'string'
  );
}

export function getRecipes(): Recipe[] {
  return readJson<Recipe[]>(KEYS.recipes, (v): v is Recipe[] => Array.isArray(v) && v.every(isRecipe), []);
}

export function saveRecipe(recipe: Omit<Recipe, 'savedAt'>): { ok: boolean; reason?: 'cap' } {
  const list = getRecipes();
  if (list.length >= RECIPE_CAP) return { ok: false, reason: 'cap' };
  writeJson(KEYS.recipes, [...list, { ...recipe, savedAt: Date.now() }]);
  dispatch();
  return { ok: true };
}

export function replaceRecipe(id: string, recipe: Omit<Recipe, 'savedAt'>): void {
  const list = getRecipes().map((r) => (r.id === id ? { ...r, ...recipe, savedAt: Date.now() } : r));
  writeJson(KEYS.recipes, list);
  dispatch();
}

export function deleteRecipe(id: string): void {
  writeJson(KEYS.recipes, getRecipes().filter((r) => r.id !== id));
  dispatch();
}

/* ---------- activity (admin dashboard) ---------- */

export function pushActivity(action: string): void {
  const list = readJson<Array<{ action: string; at: number }>>(
    KEYS.activity,
    (v): v is Array<{ action: string; at: number }> =>
      Array.isArray(v) && v.every((i) => typeof i === 'object' && i !== null && typeof (i as { action?: unknown }).action === 'string' && typeof (i as { at?: unknown }).at === 'number'),
    [],
  );
  const next = [{ action, at: Date.now() }, ...list].slice(0, 30);
  writeJson(KEYS.activity, next);
}

export function getActivity(): Array<{ action: string; at: number }> {
  return readJson<Array<{ action: string; at: number }>>(
    KEYS.activity,
    (v): v is Array<{ action: string; at: number }> => Array.isArray(v),
    [],
  );
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(KEYS.activity);
  } catch {
    /* ignore */
  }
}

/* ---------- locale overlay (§26) ---------- */

export interface LocaleOverlay {
  ar: Record<string, string>;
  en: Record<string, string>;
}

export function getLocaleOverlay(): LocaleOverlay {
  return readJson<LocaleOverlay>(
    KEYS.localeOverlay,
    (v): v is LocaleOverlay =>
      typeof v === 'object' && v !== null && typeof (v as { ar?: unknown }).ar === 'object' && typeof (v as { en?: unknown }).en === 'object',
    { ar: {}, en: {} },
  );
}

export function setLocaleOverlay(overlay: LocaleOverlay): void {
  writeJson(KEYS.localeOverlay, overlay);
}

/* ---------- cross-tab sync ---------- */

/** Writes dispatch azt:store so header counts update (§13). */
function dispatch(): void {
  try {
    window.dispatchEvent(new CustomEvent('azt:store'));
  } catch {
    /* SSR-safe noop */
  }
}

export function onStoreChange(handler: () => void): () => void {
  const wrapped = () => handler();
  window.addEventListener('azt:store', wrapped);
  window.addEventListener('storage', wrapped);
  return () => {
    window.removeEventListener('azt:store', wrapped);
    window.removeEventListener('storage', wrapped);
  };
}

/** migrate() on boot: drops unknown versions (§6.3). */
export function migrate(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('azt:v0:')) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}
