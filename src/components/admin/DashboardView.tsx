/**
 * DashboardView (§24) — stat cards, recent activity, publish banner,
 * quick actions. Reads the draft overlay + content for real numbers.
 */
import { useEffect, useMemo, useState } from 'react';
import { fabrics } from '../../lib/content';
import { getActivity } from '../../lib/store';
import { draftIndex } from '../../lib/adminContent';
import { loadPublishSettings } from '../../lib/publish';
import { localeDicts } from '../../lib/content';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/url';
import { StatCard, ConnectionStatus } from './adminUi';

export interface Props {
  locale: Locale;
  onNavigate: (path: string) => void;
}

export default function DashboardView({ locale, onNavigate }: Props) {
  const [activity, setActivity] = useState<Array<{ action: string; at: number }>>([]);
  const [draftCount, setDraftCount] = useState(0);
  const connected = useMemo(() => loadPublishSettings() !== null, []);

  useEffect(() => {
    setActivity(getActivity());
    setDraftCount(draftIndex().length);
  }, []);

  const live = fabrics.length;
  const outOfStock = fabrics.filter((f) => f.availability === 'out-of-stock').length;
  const gradeCounts = { A: 0, B: 0, C: 0 };
  for (const f of fabrics) gradeCounts[f.grade]++;

  const arKeys = Object.keys(localeDicts.ar as Record<string, string>);
  const enDict = localeDicts.en as Record<string, string>;
  const missingEn = arKeys.filter((k) => !enDict[k]);
  const translationPct = Math.round(((arKeys.length - missingEn.length) / arKeys.length) * 100);

  const renders = fabrics.filter((f) => f.source === 'render').length;
  const withPhotos = fabrics.filter((f) => f.source === 'photo').length;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {!connected && (
        <div className="azt-card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem' }}>
            <strong>{t(locale, 'admin.localDraft')}</strong> — {t(locale, 'admin.localDraftHint')}
          </span>
          <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 40 }} onClick={() => onNavigate('settings')}>
            {t(locale, 'admin.settings')}
          </button>
        </div>
      )}

      <div className="azt-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label={t(locale, 'admin.liveFabrics')} value={live} locale={locale} />
        <StatCard label={t(locale, 'admin.drafts')} value={draftCount} locale={locale} />
        <StatCard label={t(locale, 'admin.outOfStock')} value={outOfStock} locale={locale} />
        <StatCard label={t(locale, 'admin.translationComplete')} value={`${translationPct}%`} locale={locale} />
        <StatCard label={t(locale, 'admin.renderCoverage')} value={`${withPhotos}/${live}`} locale={locale} />
        <StatCard label={t(locale, 'admin.gradeDistribution')} value={`A${gradeCounts.A} · B${gradeCounts.B} · C${gradeCounts.C}`} locale={locale} />
      </div>

      <div className="azt-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        <section className="azt-card" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{t(locale, 'admin.recentActivity')}</h2>
          {activity.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--color-ink-500)', fontSize: '0.85rem' }}>{locale === 'ar' ? 'مافي نشاط لسه' : 'No activity yet'}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6, fontSize: '0.82rem' }}>
              {activity.slice(0, 10).map((a, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, justifyContent: 'space-between', borderBlockStart: i === 0 ? 'none' : '1px solid var(--azt-hairline)', paddingBlockStart: i === 0 ? 0 : 8 }}>
                  <span className="azt-mono">{a.action}</span>
                  <span className="azt-mono" style={{ color: 'var(--color-ink-500)' }}>{new Date(a.at).toLocaleString(locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="azt-card" style={{ padding: 20, display: 'grid', gap: 12, alignContent: 'start' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>{t(locale, 'admin.quickActions')}</h2>
          <ConnectionStatus connected={connected} locale={locale} />
          <div style={{ display: 'grid', gap: 8 }}>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifyContent: 'flex-start' }} onClick={() => onNavigate('fabrics')}>
              {t(locale, 'admin.fabrics')}
            </button>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifyContent: 'flex-start' }} onClick={() => onNavigate('generate')}>
              {t(locale, 'admin.generate')}
            </button>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifyContent: 'flex-start' }} onClick={() => onNavigate('publish')}>
              {t(locale, 'admin.publish')}
            </button>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44, justifyContent: 'flex-start' }} onClick={() => onNavigate('translations')}>
              {t(locale, 'admin.translations')}
            </button>
          </div>
        </section>
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
        {locale === 'ar' ? `الأقمشة: ${live} — صور حقيقية: ${withPhotos} — تصوير تقديري: ${renders}` : `Fabrics: ${live} — photos: ${withPhotos} — renders: ${renders}`}
      </p>
    </div>
  );
}
