/**
 * TwinViewer — three.js fabric mesh with drape / stretch / weight sliders
 * (§8/#3 Twin Studio, §6.6, §6.10).
 * - client:only island; all DOM/three work in useEffect
 * - uniforms via a shared ref, not React state; slider changes are
 *   applied on the next RAF tick
 * - disposes geometries/materials/textures; cancels RAF; disconnects
 *   ResizeObserver; pauses RAF offscreen; clamps DPR to 2
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { fabricArt } from '../lib/fabricArt';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/url';
import type { Fabric } from '../lib/schema';

export interface Props {
  fabric: Fabric;
  locale: Locale;
}

interface Uniforms {
  drape: number;
  stretch: number;
  weight: number;
}

export default function TwinViewer({ fabric, locale }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  // Single source of truth for slider values — the RAF loop reads it.
  const uniformsRef = useRef<Uniforms>({ drape: 0.5, stretch: 1, weight: 0.5 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion =
      typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

    let disposed = false;
    let rafId = 0;
    let visible = true;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    // Generated environment map — no external HDRIs (§6.10)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    // Fabric texture generated locally from the seeded schematic
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512;
    texCanvas.height = 512;
    const tctx = texCanvas.getContext('2d');
    const svg = fabricArt({ seed: fabric.seed ?? 1, shade: fabric.shades[0]?.hex ?? '#C8A45C', grade: fabric.grade, construction: fabric.composition, w: 512, h: 512 });
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    img.onload = () => {
      tctx?.drawImage(img, 0, 0, 512, 512);
      texture.needsUpdate = true;
      URL.revokeObjectURL(svgUrl);
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;

    const geometry = new THREE.PlaneGeometry(3, 3.6, 48, 56);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const original = geometry.attributes.position.array.slice();

    function deform() {
      const u = uniformsRef.current;
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const x = original[i]!;
        const y = original[i + 1]!;
        pos[i] = x * u.stretch;
        pos[i + 1] = y;
        const foldAmp = u.drape * 0.28;
        const foldFreq = 2.2 + u.drape * 1.4;
        pos[i + 2] =
          Math.sin(x * foldFreq + y * foldFreq * 0.4) * foldAmp +
          Math.cos(y * foldFreq * 0.8) * foldAmp * 0.4;
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    function frame() {
      if (!visible || disposed) return;
      const u = uniformsRef.current;
      material.roughness = 0.85 - u.weight * 0.25;
      material.metalness = u.weight * 0.05;
      mesh.scale.set(u.stretch, 1, 1);
      deform();
      if (!reduceMotion) mesh.rotation.y += 0.004;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    const resizeObserver = new ResizeObserver(() => {
      if (disposed) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 480;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(mount);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [fabric, locale]);

  function setUniform(key: keyof Uniforms, v: number) {
    uniformsRef.current[key] = v;
  }

  return (
    <div>
      <div
        ref={mountRef}
        role="img"
        aria-label={t(locale, 'twin.alt', { name: locale === 'ar' ? fabric.name.ar : fabric.name.en })}
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          background: 'var(--color-sand-100)',
          border: '1px solid var(--azt-hairline)',
          borderRadius: 'var(--azt-radius)',
          overflow: 'hidden',
        }}
      />
      <div style={{ display: 'grid', gap: 14, marginBlockStart: 16 }}>
        <RangeSlider label={t(locale, 'twin.drape')} value={uniformsRef.current.drape} onChange={(v) => setUniform('drape', v)} />
        <RangeSlider label={t(locale, 'twin.stretch')} value={uniformsRef.current.stretch} onChange={(v) => setUniform('stretch', v)} />
        <RangeSlider label={t(locale, 'twin.weight')} value={uniformsRef.current.weight} onChange={(v) => setUniform('weight', v)} />
      </div>
    </div>
  );
}

function RangeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: '0.85rem' }}>{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={`${Math.round(value * 100)}%`}
        style={{ accentColor: 'var(--color-ink-900)', width: '100%' }}
      />
    </label>
  );
}
