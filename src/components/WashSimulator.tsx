/**
 * WashSimulator — denim wash shader (§8/#6 Wash Lab, §6.6, §6.10).
 * MeshStandardMaterial with generated maps; wash parameters injected as
 * uniforms through onBeforeCompile and updated through refs on the RAF
 * tick (not React state). Before/after split via scissor in one canvas.
 * Recipes capped at 4 (§13), saved/reloaded through the store.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import { deleteRecipe, getRecipes, saveRecipe, type Recipe } from '../lib/store';

export interface Props {
  locale: Locale;
}

interface WashUniforms {
  temp: number; // 0..1
  time: number; // 0..1
  ratio: number; // 0..1
  aggressive: number; // 0..1
}

const DEFAULTS: WashUniforms = { temp: 0.4, time: 0.4, ratio: 0.3, aggressive: 0.3 };

function makeDenimTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#2F4A6B';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect((i * 97) % 512, (i * 53) % 512, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function WashSimulator({ locale }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const uniformsRef = useRef<WashUniforms>({ ...DEFAULTS });
  const exportRequest = useRef<{ request: () => void } | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRecipes(getRecipes());
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let disposed = false;
    let rafId = 0;
    let visible = true;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const makeScene = () => {
      const scene = new THREE.Scene();
      scene.environment = envTex;
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 3.2);
      const texture = makeDenimTexture();
      const geometry = new THREE.PlaneGeometry(3, 2.2, 32, 24);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      // Inject wash uniforms through onBeforeCompile (§6.10: uniforms via refs)
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uWash = { value: { ...uniformsRef.current } };
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
            float wash = shader.uniforms.uWash.value.time * 0.35 + shader.uniforms.uWash.value.temp * 0.18;
            float abrasion = shader.uniforms.uWash.value.aggressive * shader.uniforms.uWash.value.time;
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.52, 0.62), wash);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.85, 0.88, 0.9), abrasion * 0.35);`,
        );
        material.userData.shader = shader;
      };
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      return { scene, camera, mesh, material, texture, geometry };
    };

    const before = makeScene();
    const after = makeScene();

    function applyUniforms() {
      const u = uniformsRef.current;
      for (const scene of [before, after]) {
        const shader = scene.material.userData.shader as
          | { uniforms: { uWash: { value: WashUniforms } } }
          | undefined;
        if (shader) shader.uniforms.uWash.value = { ...u };
      }
    }

    function resize() {
      if (!mount) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 400;
      renderer.setSize(w, h);
      before.camera.aspect = w / h / 2;
      after.camera.aspect = w / h / 2;
      before.camera.updateProjectionMatrix();
      after.camera.updateProjectionMatrix();
    }
    resize();
    const resizeObserver = new ResizeObserver(() => {
      if (!disposed) resize();
    });
    resizeObserver.observe(mount);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(mount);

    let exportRequested = false;

    function renderHalf(scene: { scene: THREE.Scene; camera: THREE.PerspectiveCamera }, x: number, w: number) {
      const size = renderer.getSize(new THREE.Vector2());
      renderer.setViewport(x, 0, w, size.y);
      renderer.setScissor(x, 0, w, size.y);
      renderer.setScissorTest(true);
      renderer.render(scene.scene, scene.camera);
    }

    function frame() {
      if (!visible || disposed) return;
      applyUniforms();
      const total = renderer.getSize(new THREE.Vector2()).x;
      renderHalf(before, 0, Math.floor(total / 2));
      renderHalf(after, Math.floor(total / 2), Math.ceil(total / 2));
      if (!reduceMotion) {
        before.mesh.rotation.y += 0.003;
        after.mesh.rotation.y += 0.003;
      }
      // Capture immediately after the render (drawing buffer still valid)
      if (exportRequested) {
        exportRequested = false;
        try {
          const out = document.createElement('canvas');
          out.width = renderer.domElement.width;
          out.height = renderer.domElement.height;
          out.getContext('2d')?.drawImage(renderer.domElement, 0, 0);
          const a = document.createElement('a');
          a.href = out.toDataURL('image/png');
          a.download = 'azt-wash-lab.png';
          a.click();
        } catch {
          /* capture failed — non-fatal */
        }
      }
      renderer.setScissorTest(false);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    // Bridge: component-level export request reaches the RAF loop
    exportRequest.current = { request: () => { exportRequested = true; } };

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      for (const s of [before, after]) {
        s.geometry.dispose();
        s.material.dispose();
        s.texture.dispose();
      }
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [locale]);

  function setWash(key: keyof WashUniforms, v: number) {
    uniformsRef.current[key] = v;
  }

  function exportStill() {
    exportRequest.current?.request();
  }

  function save() {
    const u = uniformsRef.current;
    const res = saveRecipe({
      id: `r${Date.now()}`,
      name: `${Math.round(u.temp * 70 + 20)}°C · ${Math.round(u.time * 55 + 5)}m`,
      temp: Math.round(u.temp * 70 + 20),
      time: Math.round(u.time * 55 + 5),
      ratio: Math.round(u.ratio * 100),
      cycle: u.aggressive > 0.66 ? 'aggressive' : u.aggressive > 0.33 ? 'normal' : 'gentle',
    });
    if (!res.ok) {
      setSaved(false);
      return;
    }
    setRecipes(getRecipes());
    setSaved(true);
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 860 }}>
      <div className="azt-grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>
        <div>
          <div ref={mountRef} style={{ width: '100%', aspectRatio: '4 / 1', background: 'var(--color-sand-100)', border: '1px solid var(--azt-hairline)', borderRadius: 'var(--azt-radius)', overflow: 'hidden' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBlockStart: 12 }}>
            <button type="button" className="azt-btn" style={{ minHeight: 44 }} onClick={exportStill}>
              {t(locale, 'wash.export')}
            </button>
            <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 44 }} onClick={save}>
              {t(locale, 'wash.save')}
            </button>
          </div>
          {saved && <p role="status" style={{ margin: '8px 0 0', color: 'var(--color-ok)', fontSize: '0.82rem' }}>{t(locale, 'wash.saved')}</p>}
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <WashSlider label={t(locale, 'wash.temp')} min={20} max={90} value={Math.round(uniformsRef.current.temp * 70 + 20)} onChange={(v) => setWash('temp', (v - 20) / 70)} />
          <WashSlider label={t(locale, 'wash.time')} min={5} max={60} value={Math.round(uniformsRef.current.time * 55 + 5)} onChange={(v) => setWash('time', (v - 5) / 55)} unit={locale === 'ar' ? 'دقيقة' : 'min'} />
          <WashSlider label={t(locale, 'wash.ratio')} min={0} max={10} value={Math.round(uniformsRef.current.ratio * 10)} onChange={(v) => setWash('ratio', v / 10)} unit="%" />
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: '0.85rem' }}>{t(locale, 'wash.cycle')}</span>
            <select
              className="azt-input"
              value={uniformsRef.current.aggressive > 0.66 ? 'aggressive' : uniformsRef.current.aggressive > 0.33 ? 'normal' : 'gentle'}
              onChange={(e) => setWash('aggressive', e.target.value === 'aggressive' ? 0.8 : e.target.value === 'normal' ? 0.5 : 0.2)}
            >
              <option value="gentle">{locale === 'ar' ? 'لطيف' : 'Gentle'}</option>
              <option value="normal">{locale === 'ar' ? 'عادي' : 'Normal'}</option>
              <option value="aggressive">{locale === 'ar' ? 'شديد' : 'Aggressive'}</option>
            </select>
          </label>
        </div>
      </div>

      <section className="azt-card" style={{ padding: 20 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1rem' }}>{t(locale, 'wash.savedList')}</h2>
        {recipes.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--color-ink-700)' }}>{t(locale, 'trade.savedLotsEmpty')}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {recipes.map((r) => (
              <li key={r.id} className="azt-card" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span className="azt-mono" style={{ fontSize: '0.8rem' }}>
                  {r.name} · {r.temp}°C · {r.time}m · {r.ratio}%
                </span>
                <button type="button" className="azt-btn azt-btn-ghost" style={{ minHeight: 36, fontSize: '0.78rem' }} onClick={() => { deleteRecipe(r.id); setRecipes(getRecipes()); }}>
                  {t(locale, 'sample.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}
        {recipes.length >= 4 && (
          <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: 'var(--color-madder)' }}>{t(locale, 'wash.overwrite')}</p>
        )}
      </section>
    </div>
  );
}

function WashSlider({ label, min, max, value, onChange, unit }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: '0.85rem' }}>
        {label} <span className="azt-mono" style={{ color: 'var(--color-ink-500)' }}>{value}{unit ?? ''}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={`${value}${unit ?? ''}`}
        style={{ accentColor: 'var(--color-ink-900)', width: '100%' }}
      />
    </label>
  );
}
