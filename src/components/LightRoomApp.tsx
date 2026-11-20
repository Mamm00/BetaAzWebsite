/**
 * LightRoomApp — lighting simulator over a fabric plate. CSS filter
 * approximations of each spectrum (§8); toggles only, no three.js.
 */
import { useState } from 'react';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { fabrics } from '../lib/content';
import { mediaUrl } from '../assets/media';

export interface Props {
  locale: Locale;
}

type Light = 'd50' | 'd65' | 'tl84' | 'horizon' | 'uv';

const FILTERS: Record<Light, string> = {
  d50: 'brightness(1.06) saturate(0.95) hue-rotate(-6deg) contrast(0.98)',
  d65: 'brightness(1.02) saturate(1.02) hue-rotate(0deg) contrast(1.0)',
  tl84: 'brightness(0.98) saturate(1.12) hue-rotate(4deg) contrast(1.04)',
  horizon: 'brightness(0.94) saturate(1.15) hue-rotate(-14deg) contrast(0.96)',
  uv: 'brightness(1.08) saturate(1.25) hue-rotate(10deg) contrast(1.06)',
};

const LIGHTS: Light[] = ['d50', 'd65', 'tl84', 'horizon', 'uv'];

export default function LightRoomApp({ locale }: Props) {
  const [fabricSlug, setFabricSlug] = useState(fabrics[0]!.slug);
  const [light, setLight] = useState<Light>('d65');

  const f = fabrics.find((x) => x.slug === fabricSlug)!;
  const photo = mediaUrl(f.photo);

  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 860 }}>
      <div className="azt-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: '0.85rem' }}>{t(locale, 'twin.fabric')}</span>
          <select className="azt-input" value={fabricSlug} onChange={(e) => setFabricSlug(e.target.value)}>
            {fabrics.map((x) => (
              <option key={x.slug} value={x.slug}>
                {locale === 'ar' ? x.name.ar : x.name.en} · {x.code} · {x.grade}
              </option>
            ))}
          </select>
        </label>

        <div style={{ position: 'relative', aspectRatio: '4 / 5', background: 'var(--color-sand-100)', border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)', overflow: 'hidden' }}>
          {photo ? (
            <img src={photo} alt={locale === 'ar' ? f.name.ar : f.name.en} width={800} height={1000} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: FILTERS[light] }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: f.shades[0]!.hex, filter: FILTERS[light] }} />
          )}
          <div style={{ position: 'absolute', insetBlockStart: 12, insetInlineEnd: 12, padding: '6px 12px', background: 'rgba(12, 11, 9, 0.75)', color: 'var(--color-sand-50)', borderRadius: 'var(--azt-radius)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            {t(locale, `light.${light}`)}
          </div>
        </div>

        <div role="radiogroup" aria-label={locale === 'ar' ? 'أنواع الضوء' : 'Light types'} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LIGHTS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={light === l}
              onClick={() => setLight(l)}
              style={{
                minHeight: 44,
                padding: '8px 16px',
                border: light === l ? '1px solid var(--color-ink-900)' : '1px solid var(--azt-hairline)',
                background: light === l ? 'var(--color-ink-900)' : 'var(--color-sand-50)',
                color: light === l ? 'var(--color-sand-50)' : 'inherit',
                borderRadius: 'var(--azt-radius)',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              {t(locale, `light.${l}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
