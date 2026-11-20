/**
 * TradeDeskApp — role gating + tabs: Saved lots, Sample list, Quotes,
 * Downloads. Registration is local-only (§23-style honesty: a curtain).
 */
import { useEffect, useState } from 'react';
import {
  addSample,
  clearSamples,
  getSamples,
  listLots,
  listQuotes,
  onStoreChange,
  removeLot,
  removeSample,
  saveLot,
  type SampleItem,
} from '../lib/store';
import { t } from '../lib/i18n';
import { locUrl, type Locale } from '../lib/url';
import { waLink } from '../lib/wa';
import { fabrics, priceLabel } from '../lib/content';

export interface Props {
  locale: Locale;
}

type Role = 'visitor' | 'registered' | 'verified';

interface Trader {
  name: string;
  role: Role;
}

const TRADER_KEY = 'azt:v1:trader';

export default function TradeDeskApp({ locale }: Props) {
  const [trader, setTrader] = useState<Trader | null>(null);
  const [tab, setTab] = useState('lots');
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [lots, setLots] = useState(listLots());
  const [quotes] = useState(listQuotes());
  const [name, setName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRADER_KEY);
      if (raw) setTrader(JSON.parse(raw) as Trader);
    } catch {
      setTrader(null);
    }
    setSamples(getSamples());
    const off = onStoreChange(() => {
      setSamples(getSamples());
      setLots(listLots());
    });
    return off;
  }, []);

  function register(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const next: Trader = { name: name.trim(), role: 'registered' };
    try {
      localStorage.setItem(TRADER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setTrader(next);
    setName('');
  }

  function signOut() {
    try {
      localStorage.removeItem(TRADER_KEY);
    } catch {
      /* ignore */
    }
    setTrader(null);
  }

  if (!trader) {
    return (
      <div className="azt-card" style={{ padding: 28, display: 'grid', gap: 16, maxWidth: 560 }}>
        <h2 style={{ margin: 0 }}>{t(locale, 'trade.visitorLocked')}</h2>
        <form onSubmit={register} noValidate style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.85rem' }}>{t(locale, 'contact.formName')}</span>
            <input className="azt-input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit" className="azt-btn" style={{ justifySelf: 'start' }}>
            {t(locale, 'trade.register')}
          </button>
        </form>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>
          {locale === 'ar' ? 'التسجيل بيحفظ الاسم على الجهاز ده بس — مافي رفع لأي سيرفِر.' : 'Registration stores your name on this device only — nothing is uploaded.'}
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'lots', label: t(locale, 'trade.tab.lots') },
    { id: 'samples', label: t(locale, 'trade.tab.samples') },
    { id: 'quotes', label: t(locale, 'trade.tab.quotes') },
    { id: 'downloads', label: t(locale, 'trade.tab.downloads') },
  ];

  return (
    <div className="azt-card" style={{ padding: 24, display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <p style={{ margin: 0 }}>
          <strong>{trader.name}</strong> · {t(locale, `trade.role.${trader.role}`)}
        </p>
        <button type="button" className="azt-btn azt-btn-ghost" onClick={signOut} style={{ minHeight: 40 }}>
          {t(locale, 'common.cancel')}
        </button>
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 0, borderBlockEnd: '1px solid var(--azt-hairline)' }}>
        {tabs.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            style={{
              padding: '10px 14px',
              minHeight: 44,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              font: 'inherit',
              color: tab === tb.id ? 'var(--color-ink-900)' : 'var(--color-ink-500)',
              borderBlockEnd: tab === tb.id ? '2px solid var(--color-ink-900)' : '2px solid transparent',
              marginBlockEnd: -1,
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'lots' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {lots.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{t(locale, 'trade.savedLotsEmpty')}</p>
          ) : (
            lots.map((lot) => {
              const f = fabrics.find((x) => x.code === (lot.data as { code?: string })?.code);
              return (
                <div key={lot.id} className="azt-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{f ? (locale === 'ar' ? f.name.ar : f.name.en) : lot.id}</strong>
                    {f && <span className="azt-mono azt-grade-c" style={{ fontSize: '0.75rem', marginInlineStart: 8 }}>{f.code} · {f.grade}</span>}
                  </div>
                  <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36, fontSize: '0.8rem' }} onClick={() => { removeLot(lot.id); setLots(listLots()); }}>
                    {t(locale, 'sample.remove')}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'samples' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <p className="azt-mono" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-500)' }}>{t(locale, 'trade.samplesCount', { count: samples.length })}</p>
          {samples.length === 0 ? (
            <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{t(locale, 'trade.samplesEmpty')}</p>
          ) : (
            samples.map((s) => {
              const f = fabrics.find((x) => x.slug === s.slug);
              return (
                <div key={s.slug} className="azt-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{f ? (locale === 'ar' ? f.name.ar : f.name.en) : s.slug}</strong>
                    <span className="azt-mono" style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', marginInlineStart: 8 }}>{s.grade} · {s.metres} {t(locale, 'common.metresShort')}</span>
                  </div>
                  <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36, fontSize: '0.8rem' }} onClick={() => { removeSample(s.slug); setSamples(getSamples()); }}>
                    {t(locale, 'sample.remove')}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'quotes' && (
        <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>
          {quotes.length === 0 ? t(locale, 'trade.quotesEmpty') : `${quotes.length} ${t(locale, 'trade.tab.quotes')}`}
        </p>
      )}

      {tab === 'downloads' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{t(locale, 'trade.downloadsEmpty')}</p>
          {samples.length > 0 && (
            <button
              type="button"
              className="azt-btn"
              onClick={() => {
                const lines = samples.map((s) => `${s.slug} — ${s.grade} — ${s.metres}m`).join('\n');
                const blob = new Blob([lines], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'azt-samples.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              {t(locale, 'trade.downloadReport')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
