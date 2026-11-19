/**
 * publish.ts — GitHub Pages content publish pipeline (§26).
 * Staged list → sequential PUTs with 350ms gap. UTF-8 base64 via
 * TextEncoder → binary string → btoa (plain btoa breaks on Arabic).
 * 409 stops and names the colliding file; 401/403 surfaces the scope.
 */

export interface PublishSettings {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export const PUBLISH_KEY = 'azt:v2:publish';

export function loadPublishSettings(): PublishSettings | null {
  try {
    const raw = localStorage.getItem(PUBLISH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublishSettings>;
    if (!parsed.owner || !parsed.repo || !parsed.branch || !parsed.token) return null;
    return parsed as PublishSettings;
  } catch {
    return null;
  }
}

export function savePublishSettings(s: PublishSettings): void {
  try {
    localStorage.setItem(PUBLISH_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export interface StagedFile {
  path: string; // repo path, e.g. src/content/fabrics.json
  content: string;
  sha?: string;
}

/** UTF-8 safe base64 (§26). */
export function toBase64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function apiHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${token}`,
  };
}

export interface PublishResult {
  ok: boolean;
  committed: Array<{ path: string; sha: string }>;
  error?: string;
  collidingPath?: string;
  runUrl?: string;
}

export interface PublishProgress {
  stage: 'start' | 'done' | 'error';
  index: number;
  total: number;
  path?: string;
  message?: string;
}

/**
 * Publish staged files sequentially. `onProgress` is called per step;
 * a 409 stops the run and names the colliding file.
 */
export async function publishFiles(
  files: StagedFile[],
  settings: PublishSettings,
  onProgress: (p: PublishProgress) => void,
): Promise<PublishResult> {
  const { owner, repo, branch, token } = settings;
  const committed: Array<{ path: string; sha: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    onProgress({ stage: 'start', index: i, total: files.length, path: file.path });
    const encoded = file.path.split('/').map((seg) => encodeURIComponent(seg)).join('/');

    // GET current contents for the sha
    let sha: string | undefined = file.sha;
    if (!sha) {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
        { headers: apiHeaders(token) },
      );
      if (getRes.status === 404) {
        // new file — no sha needed
      } else if (!getRes.ok) {
        const body = await getRes.json().catch(() => ({}));
        return {
          ok: false,
          committed,
          error: describeGitHubError(getRes.status, body),
        };
      } else {
        const data = (await getRes.json()) as { sha?: string };
        sha = data.sha;
      }
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}`,
      {
        method: 'PUT',
        headers: { ...apiHeaders(token), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `azt: update ${file.path}`,
          content: toBase64Utf8(file.content),
          branch,
          ...(sha ? { sha } : {}),
        }),
      },
    );

    if (putRes.status === 409) {
      return { ok: false, committed, collidingPath: file.path, error: '409 conflict' };
    }
    if (!putRes.ok) {
      const body = await putRes.json().catch(() => ({}));
      return { ok: false, committed, error: describeGitHubError(putRes.status, body) };
    }

    const data = (await putRes.json()) as { commit?: { sha?: string }; content?: { sha?: string } };
    committed.push({ path: file.path, sha: data.content?.sha ?? data.commit?.sha ?? 'unknown' });
    onProgress({ stage: 'done', index: i, total: files.length, path: file.path });

    // 350ms gap between files (§26)
    if (i < files.length - 1) await new Promise((r) => setTimeout(r, 350));
  }

  // Poll the Actions API once for the run URL — never loop (§26)
  let runUrl: string | undefined;
  try {
    const runsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
      { headers: apiHeaders(token) },
    );
    if (runsRes.ok) {
      const runs = (await runsRes.json()) as { workflow_runs?: Array<{ html_url?: string }> };
      runUrl = runs.workflow_runs?.[0]?.html_url;
    }
  } catch {
    /* non-fatal */
  }

  return { ok: true, committed, runUrl };
}

function describeGitHubError(status: number, body: unknown): string {
  const msg = (body as { message?: string } | null)?.message ?? String(status);
  if (status === 401) return `401: token rejected — check the token (${msg})`;
  if (status === 403) return `403: missing scope — the token needs Contents: read/write on this repo (${msg})`;
  return `${status}: ${msg}`;
}
