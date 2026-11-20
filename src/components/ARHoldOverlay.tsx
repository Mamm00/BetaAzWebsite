/**
 * ARHoldOverlay — "Hold the fabric": camera feed with the fabric schematic
 * overlaid, so the buyer sees the bolt "in hand" (§10 product page).
 * Camera only inside useEffect; tracks stopped and object URLs released
 * on unmount (§6.6).
 */
import { useEffect, useRef, useState } from 'react';
import { fabricArt } from '../lib/fabricArt';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import type { Fabric } from '../lib/schema';

export interface Props {
  fabric: Fabric;
  locale: Locale;
}

export default function ARHoldOverlay({ fabric, locale }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setActive(true);
        setError(null);
      } catch {
        if (!cancelled) setError(locale === 'ar' ? 'الكاميرا مش متاحة — شوف القماش في المعرض' : 'Camera unavailable — see the fabric in the gallery');
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [locale]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, aspectRatio: '3 / 4', border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)', overflow: 'hidden', background: 'var(--color-sand-100)' }}>
      {!active && (
        <button
          type="button"
          className="azt-btn azt-btn-ghost"
          onClick={() => { if (streamRef.current) setActive(true); }}
          style={{ position: 'absolute', inset: 0, borderRadius: 0, minHeight: '100%', flexDirection: 'column', gap: 8 }}
          data-hold-start
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" focusable="false">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
          <span style={{ fontSize: '0.9rem' }}>{t(locale, 'product.hold')}</span>
        </button>
      )}
      {error && <p style={{ position: 'absolute', insetBlockEnd: 8, insetInline: 12, margin: 0, fontSize: '0.78rem', color: 'var(--color-madder)' }}>{error}</p>}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: active ? 'block' : 'none' }}
        aria-label={t(locale, 'product.hold')}
      />
      {active && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.85 }}
          dangerouslySetInnerHTML={{
            __html: fabricArt({ seed: fabric.seed ?? 0, shade: fabric.shades[0]?.hex ?? '#C8A45C', grade: fabric.grade, construction: fabric.composition, w: 720, h: 960 }),
          }}
        />
      )}
    </div>
  );
}
