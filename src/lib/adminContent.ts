/**
 * adminContent.ts — the overlay model (§26).
 * Public pages read build-time JSON; admin edits overlay drafts on top:
 * JSON → localStorage drafts → unsaved form state. Deep, array-aware,
 * keyed by id. Autosave every 10s while dirty; discard restores the layer
 * below and clears the key.
 */
import { KEYS, readJson, writeJson } from './store';

/** Deep merge: objects merge, arrays replace (keyed by id where applicable). */
export function deepMerge<T>(base: T, overlay: unknown): T {
  if (overlay === null || overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) {
    if (Array.isArray(base[0]) && typeof base[0] === 'object' && base[0] !== null) {
      const key = 'id' in (base[0] as object) ? 'id' : 'slug';
      const map = new Map<string, unknown>();
      for (const item of base) {
        const k = String((item as Record<string, unknown>)[key] ?? JSON.stringify(item));
        map.set(k, item);
      }
      for (const item of overlay) {
        const k = String((item as Record<string, unknown>)[key] ?? JSON.stringify(item));
        map.set(k, deepMerge(map.get(k) ?? item, item));
      }
      return [...map.values()] as unknown as T;
    }
    return overlay as T;
  }
  if (typeof base === 'object' && base !== null && typeof overlay === 'object' && overlay !== null) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(overlay as Record<string, unknown>)) {
      out[k] = k in out ? deepMerge(out[k], v) : v;
    }
    return out as T;
  }
  return overlay as T;
}

export function getDraft<T>(collection: string, id: string, fallback: T): T {
  return readJson<T>(KEYS.draft(collection, id), (v): v is T => typeof v === 'object' && v !== null, fallback);
}

export function saveDraft(collection: string, id: string, value: unknown): void {
  writeJson(KEYS.draft(collection, id), value);
}

export function discardDraft(collection: string, id: string): void {
  try {
    localStorage.removeItem(KEYS.draft(collection, id));
  } catch {
    /* ignore */
  }
}

export function listDrafts(): Array<{ collection: string; id: string }> {
  const out: Array<{ collection: string; id: string }> = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('azt:v2:draft:')) continue;
      const rest = k.slice('azt:v2:draft:'.length);
      const idx = rest.lastIndexOf(':');
      out.push({ collection: rest.slice(0, idx), id: rest.slice(idx + 1) });
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function resetAllDrafts(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('azt:v2:draft:')) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

/** Per-field validation for the fabric editor (§27). Returns messages. */
export interface FieldIssue {
  field: string;
  messageKey: string;
}

export function validateFabric(f: {
  slug?: string;
  name?: { ar: string; en: string };
  shades?: Array<{ ar: string; en: string }>;
  source?: string;
  seed?: number | null;
  photo?: string | null;
  alternatives?: string[];
  gradeNotes?: { ar: string[]; en: string[] };
}): FieldIssue[] {
  const issues: FieldIssue[] = [];
  if (!f.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) {
    issues.push({ field: 'slug', messageKey: 'admin.validation.dupSlug' });
  }
  if (!f.name?.ar.trim() || !f.name?.en.trim()) {
    issues.push({ field: 'name', messageKey: 'admin.validation.missingLocale' });
  }
  if (!f.shades || f.shades.length === 0 || f.shades.some((s) => !s.ar.trim() || !s.en.trim())) {
    issues.push({ field: 'shades', messageKey: 'admin.validation.missingLocale' });
  }
  if (f.source === 'render' && f.seed === null) {
    issues.push({ field: 'seed', messageKey: 'admin.validation.unseeded' });
  }
  if (!f.gradeNotes || f.gradeNotes.ar.length < 3 || f.gradeNotes.en.length < 3) {
    issues.push({ field: 'gradeNotes', messageKey: 'admin.validation.missingLocale' });
  }
  if (f.source === 'photo' && !f.photo) {
    issues.push({ field: 'photo', messageKey: 'admin.validation.noHero' });
  }
  return issues;
}

/** Translate a field issue into a localized message. */
export function issueText(locale: 'ar' | 'en', issue: FieldIssue, t: (l: 'ar' | 'en', k: string) => string): string {
  return t(locale, issue.messageKey);
}

/** Snapshot the draft index for the dashboard (§24). */
export function draftIndex(): Array<{ collection: string; id: string }> {
  return listDrafts();
}
