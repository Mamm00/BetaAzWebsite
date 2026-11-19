/**
 * FabricListView (§24) — fabric table with per-row local-draft markers.
 */
import { useMemo, useState } from 'react';
import { fabrics } from '../../lib/content';
import { t } from '../../lib/i18n';
import { locUrl, type Locale } from '../../lib/url';
import { DataTable } from './adminUi';

export interface Props {
  locale: Locale;
  onOpen: (slug: string) => void;
  onNew: () => void;
  draftMarker: (slug: string) => boolean;
}

interface Row {
  code: string;
  name: string;
  grade: string;
  source: string;
  state: string;
  slug: string;
}

export default function FabricListView({ locale, onOpen, onNew, draftMarker }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fabrics;
    return fabrics.filter(
      (f) =>
        f.code.toLowerCase().includes(q) ||
        f.name.ar.includes(q) ||
        f.name.en.toLowerCase().includes(q) ||
        f.slug.includes(q),
    );
  }, [search]);

  const draftCount = useMemo(() => fabrics.filter((f) => draftMarker(f.slug)).length, [draftMarker]);

  const rows: Row[] = filtered.map((f) => ({
    code: f.code,
    name: locale === 'ar' ? f.name.ar : f.name.en,
    grade: f.grade,
    source: f.source,
    state: draftMarker(f.slug) ? t(locale, 'admin.draft') : '—',
    slug: f.slug,
  }));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="azt-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        <div className="azt-card" style={{ padding: 16, display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>{t(locale, 'admin.liveFabrics')}</span>
          <strong style={{ fontSize: '1.4rem' }}>{fabrics.length}</strong>
        </div>
        <div className="azt-card" style={{ padding: 16, display: 'grid', gap: 4 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>{t(locale, 'admin.drafts')}</span>
          <strong style={{ fontSize: '1.4rem', color: draftCount ? 'var(--color-madder)' : 'var(--color-ok)' }}>{draftCount}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          className="azt-input"
          style={{ flex: 1, minWidth: 200 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === 'ar' ? 'ابحث باسم أو كود…' : 'Search by name or code…'}
          aria-label={locale === 'ar' ? 'بحث' : 'Search'}
        />
        <button type="button" className="azt-btn" style={{ minHeight: 44 }} onClick={onNew}>
          {t(locale, 'admin.newFabric')}
        </button>
      </div>

      <DataTable
        locale={locale}
        columns={[
          { key: 'code', label: t(locale, 'admin.colCode') },
          { key: 'name', label: t(locale, 'admin.colName') },
          { key: 'grade', label: t(locale, 'admin.colGrade') },
          { key: 'source', label: t(locale, 'admin.colSource') },
          { key: 'state', label: t(locale, 'admin.colState') },
        ]}
        rows={rows}
        rowKey={(r) => r.slug}
        emptyLabel={t(locale, 'catalog.noResults')}
        onRowClick={(r) => onOpen(r.slug)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {filtered.slice(0, 8).map((f) => (
          <a key={f.slug} className="azt-chip" href={locUrl(locale, `fabric/${f.slug}`)} target="_blank" rel="noopener" style={{ fontSize: '0.72rem' }}>
            {f.code}
          </a>
        ))}
      </div>
    </div>
  );
}
