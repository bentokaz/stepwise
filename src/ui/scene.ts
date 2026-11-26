/**
 * Success scenes: a short walk beside a stream through a forest, drawn live on a canvas
 * (no image files). The camera walks forward along the bank with a gentle step bob,
 * trees fade into mist with distance, the water flows and sparkles, and particles drift.
 * Tap, click or press a key to skip.
 */
import { S } from '../state';
import { $ } from './dom';

export type SceneId = 'forest' | 'dusk' | 'snow';

interface Palette {
  skyTop: string;
  skyBot: string;
  sun: string;
  fog: [number, number, number];
  groundFar: string;
  groundNear: string;
  pine: [number, number, number];
  leafy: [number, number, number];
  trunk: [number, number, number];
  water: string;
  waterDeep: string;
  shine: string;
  bank: string;
  particles: 'leaves' | 'fireflies' | 'snow';
  rays: boolean;
  snowCaps?: boolean;
}

const PAL: Record<SceneId, Palette> = {
  forest: {
    skyTop: '#7fb6d9',
    skyBot: '#e4f1e4',
    sun: 'rgba(255,244,214,.75)',
    fog: [205, 225, 210],
    groundFar: '#86a86b',
    groundNear: '#355f2b',
    pine: [30, 72, 44],
    leafy: [58, 112, 52],
    trunk: [74, 56, 40],
    water: '#5f9fb3',
    waterDeep: '#2f6f86',
    shine: 'rgba(240,252,255,.85)',
    bank: '#4b3e2c',
    particles: 'leaves',
    rays: true,
  },
  dusk: {
    skyTop: '#1b2348',
    skyBot: '#e7925c',
    sun: 'rgba(255,190,120,.55)',
    fog: [104, 86, 104],
    groundFar: '#3a3440',
    groundNear: '#141c17',
    pine: [18, 30, 26],
    leafy: [26, 40, 32],
    trunk: [30, 24, 22],
    water: '#3f5677',
    waterDeep: '#1e2b45',
    shine: 'rgba(255,214,160,.8)',
    bank: '#1d1714',
    particles: 'fireflies',
    rays: false,
  },
  snow: {
    skyTop: '#b9cbdc',
    skyBot: '#eef3f7',
    sun: 'rgba(255,255,255,.7)',
    fog: [226, 234, 240],
    groundFar: '#dfe7ee',
    groundNear: '#f4f7fa',
    pine: [36, 70, 60],
    leafy: [70, 86, 84],
    trunk: [70, 60, 54],
    water: '#7ea6b6',
    waterDeep: '#4d7d90',
    shine: 'rgba(255,255,255,.9)',
    bank: '#9aa7ae',
    particles: 'snow',
    rays: false,
    snowCaps: true,
  },
};

/* ---------- world ---------- */

/** Centre line of the stream at depth z (metres ahead). */
const streamX = (z: number) => 2.6 * Math.sin(z * 0.07) + 1.3 * Math.sin(z * 0.19 + 1.3) + 2.4;
const streamW = (z: number) => 1.5 + 0.35 * Math.sin(z * 0.13);

interface Tree {
  x: number;
  z: number;
  h: number;
  w: number;
  kind: 0 | 1;
  shade: number;
}

let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function makeTrees(): Tree[] {
  seed = 1 + Math.floor(Math.random() * 100000);
  const out: Tree[] = [];
  for (let i = 0; i < 520; i++) {
    const z = 2 + rnd() * 150;
    const x = (rnd() - 0.5) * 60;
    const sx = streamX(z);
    if (Math.abs(x - sx) < streamW(z) + 1.2) continue; // keep the water clear
    if (Math.abs(x - (sx - 3.2)) < 1.4) continue; // keep the path clear
    const kind = rnd() < 0.65 ? 0 : 1;
    out.push({ x, z, h: kind ? 6 + rnd() * 6 : 8 + rnd() * 9, w: 0, kind, shade: rnd() * 0.25 - 0.1 });
    out[out.length - 1].w = out[out.length - 1].h * (kind ? 0.45 : 0.28);
  }
  return out;
}

const mix = (a: [number, number, number], b: [number, number, number], t: number, d = 0) =>
  `rgb(${Math.round((a[0] + d * 255) * (1 - t) + b[0] * t)},${Math.round((a[1] + d * 255) * (1 - t) + b[1] * t)},${Math.round((a[2] + d * 255) * (1 - t) + b[2] * t)})`;

/* ---------- sound: a babbling stream and a couple of birds ---------- */

function ambience(kind: SceneId, dur: number) {
  if (!S.sound) return;
  try {
    const ac = new AudioContext();
    const t0 = ac.currentTime;
    const len = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
      d[i] = last * 3.2;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    // a slow wobble makes it babble instead of hiss
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = 350;
    lfo.connect(lg).connect(bp.frequency);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.5, t0 + 0.35);
    g.gain.setValueAtTime(0.5, t0 + dur - 0.6);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
    src.connect(bp).connect(g).connect(ac.destination);
    src.start(t0);
    lfo.start(t0);
    lfo.stop(t0 + dur);
    const chirp = (t: number, f: number) => {
      const o = ac.createOscillator(), cg = ac.createGain();
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.45, t + 0.09);
      cg.gain.setValueAtTime(0, t);
      cg.gain.linearRampToValueAtTime(0.035, t + 0.01);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(cg).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.12);
    };
    if (kind === 'dusk') {
      // crickets instead of birds
      for (let i = 0; i < 6; i++) chirp(t0 + 0.4 + i * 0.28, 4200);
    } else {
      chirp(t0 + 0.55, 2600);
      chirp(t0 + 0.7, 2900);
      chirp(t0 + 1.45, 3300);
      chirp(t0 + 1.58, 3100);
    }
    setTimeout(() => ac.close(), dur * 1000 + 300);
  } catch {
    /* audio unavailable */
  }
}

/* ---------- the walk ---------- */

let running: (() => void) | null = null;

export function playScene(kind: SceneId, word: string, sub: string, dur = 2.6): void {
  running?.();
  const P = PAL[kind];
  const fx = $('#fx');
  const cv = document.createElement('canvas');
  cv.className = 'scene';
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const W = innerWidth, H = innerHeight;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  fx.appendChild(cv);
  const label = document.createElement('div');
  label.className = 'scene-word';
  label.innerHTML = `<svg viewBox="0 0 44 44" fill="none"><path d="M8 23l9 9L36 12" stroke="currentColor" stroke-width="5.5" stroke-linecap="square"/></svg><div><div class="big">${word}</div><div class="sub">${sub}</div></div>`;
  fx.appendChild(label);
  const ctx = cv.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const trees = makeTrees();
  const f = Math.max(W, H * 1.1) * 0.75; // focal length in px
  const camH = 1.7;
  type P2 = { x: number; y: number; z: number; s: number; t: number; c?: number };
  const parts: P2[] = [];
  const nParts = P.particles === 'fireflies' ? 40 : P.particles === 'snow' ? 140 : 26;
  for (let i = 0; i < nParts; i++)
    parts.push({ x: Math.random() * W, y: Math.random() * H, z: 0.4 + Math.random() * 0.8, s: Math.random() * 6.28, t: Math.random() * 6.28 });
  const sparkles = Array.from({ length: 70 }, () => ({ u: Math.random() * 2 - 1, z: 1 + Math.random() * 40, ph: Math.random() * 6.28 }));

  ambience(kind, dur);

  const start = performance.now();
  let raf = 0;
  const startZ = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointerdown', stop, true);
    removeEventListener('keydown', stop, true);
    cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).onfinish = () => cv.remove();
    label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => label.remove();
    running = null;
  };
  running = stop;
  addEventListener('pointerdown', stop, true);
  addEventListener('keydown', stop, true);

  cv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, fill: 'both' });
  label.animate(
    [
      { opacity: 0, transform: 'translate(-50%,-40%) scale(.92)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.25 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: 0.8 },
      { opacity: 0, transform: 'translate(-50%,-55%) scale(1)' },
    ],
    { duration: dur * 1000 - 200, delay: 200, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' },
  );

  function frame(now: number) {
    const t = (now - start) / 1000;
    if (t > dur) return stop();
    // ease in and out of walking
    const walk = 1.9 * (t - 0.35 * Math.sin(Math.min(t / dur, 1) * Math.PI) * 0.3);
    const camZ = startZ + walk;
    const bob = Math.sin(t * 7.2) * 0.035;
    const camX = streamX(camZ + 4) - 3.2 + Math.sin(t * 3.6) * 0.04;
    const hY = H * 0.43 + bob * f * 0.2;
    const proj = (x: number, y: number, z: number) => {
      const dz = z - camZ;
      return { sx: W / 2 + ((x - camX) / dz) * f, sy: hY + ((camH + bob - y) / dz) * f, dz };
    };

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, hY);
    sky.addColorStop(0, P.skyTop);
    sky.addColorStop(1, P.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hY + 2);
    const sun = ctx.createRadialGradient(W * 0.62, hY * 0.55, 0, W * 0.62, hY * 0.55, W * 0.5);
    sun.addColorStop(0, P.sun);
    sun.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, hY + 2);
    if (kind === 'dusk') {
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 197.3) % W, sy = ((i * 89.7) % (hY * 0.6)) + 4;
        ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.7 + i));
        ctx.fillRect(sx, sy, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    }

    // ground
    const gr = ctx.createLinearGradient(0, hY, 0, H);
    gr.addColorStop(0, P.groundFar);
    gr.addColorStop(1, P.groundNear);
    ctx.fillStyle = gr;
    ctx.fillRect(0, hY, W, H - hY);

    // far treeline band in the mist
    ctx.fillStyle = mix(P.pine, P.fog, 0.78);
    ctx.beginPath();
    ctx.moveTo(0, hY + 2);
    for (let x = 0; x <= W; x += 14) ctx.lineTo(x, hY - 18 - 22 * Math.abs(Math.sin(x * 0.031 + 1.7)) - 10 * Math.sin(x * 0.11));
    ctx.lineTo(W, hY + 2);
    ctx.fill();

    // stream: build its banks from far to near
    const left: { sx: number; sy: number }[] = [], right: { sx: number; sy: number }[] = [];
    for (let z = camZ + 70; z > camZ + 0.6; z -= z - camZ > 12 ? 2 : 0.5) {
      const c = streamX(z), w = streamW(z);
      left.push(proj(c - w, 0, z));
      right.push(proj(c + w, 0, z));
    }
    // muddy bank strip
    ctx.fillStyle = P.bank;
    ctx.beginPath();
    left.forEach((p, i) => (i ? ctx.lineTo(p.sx - 3, p.sy) : ctx.moveTo(p.sx - 3, p.sy)));
    [...right].reverse().forEach((p) => ctx.lineTo(p.sx + 3, p.sy));
    ctx.fill();
    const wg = ctx.createLinearGradient(0, hY, 0, H);
    wg.addColorStop(0, P.water);
    wg.addColorStop(1, P.waterDeep);
    ctx.fillStyle = wg;
    ctx.beginPath();
    left.forEach((p, i) => (i ? ctx.lineTo(p.sx, p.sy) : ctx.moveTo(p.sx, p.sy)));
    [...right].reverse().forEach((p) => ctx.lineTo(p.sx, p.sy));
    ctx.fill();
    // flowing sparkles (the water runs towards us)
    ctx.fillStyle = P.shine;
    for (const s of sparkles) {
      const z = camZ + ((s.z - t * 2.4 - walk + 400) % 40) + 0.8;
      const c = streamX(z), w = streamW(z);
      const p = proj(c + s.u * w * 0.85, 0, z);
      const k = Math.min(1, 6 / p.dz);
      ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 4 + s.ph))) * Math.min(1, p.dz / 2);
      ctx.fillRect(p.sx - 6 * k, p.sy, 12 * k + 1, Math.max(1, 1.6 * k));
    }
    ctx.globalAlpha = 1;

    // mist band at the horizon
    const mist = ctx.createLinearGradient(0, hY - 60, 0, hY + 40);
    const [fr, fg, fb] = P.fog;
    mist.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
    mist.addColorStop(0.6, `rgba(${fr},${fg},${fb},.55)`);
    mist.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
    ctx.fillStyle = mist;
    ctx.fillRect(0, hY - 60, W, 100);

    // trees, far to near
    const vis = trees
      .map((tr) => ({ tr, ...proj(tr.x, 0, tr.z) }))
      .filter((p) => p.dz > 0.5 && p.dz < 110 && p.sx > -W && p.sx < 2 * W)
      .sort((a, b) => b.dz - a.dz);
    for (const { tr, sx, sy, dz } of vis) {
      const fog = Math.min(0.92, 1 - Math.exp(-dz / 38));
      const hp = (tr.h / dz) * f, wp = (tr.w / dz) * f;
      // trunk
      ctx.fillStyle = mix(P.trunk, P.fog, fog);
      ctx.fillRect(sx - wp * 0.07, sy - hp * (tr.kind ? 0.55 : 0.3), wp * 0.14, hp * (tr.kind ? 0.55 : 0.3));
      const sway = Math.sin(t * 1.3 + tr.x) * wp * 0.03;
      if (tr.kind === 0) {
        // pine: three stacked layers, lit on one side
        for (let k = 0; k < 3; k++) {
          const base = sy - hp * (0.18 + k * 0.24), top = sy - hp * (0.55 + k * 0.22), half = wp * (0.5 - k * 0.12);
          ctx.fillStyle = mix(P.pine, P.fog, fog, tr.shade * 0.4 - k * 0.02);
          ctx.beginPath();
          ctx.moveTo(sx - half, base);
          ctx.lineTo(sx + sway, top - hp * 0.12);
          ctx.lineTo(sx + half, base);
          ctx.fill();
          ctx.fillStyle = mix(P.pine, P.fog, fog, tr.shade * 0.4 + 0.07);
          ctx.beginPath();
          ctx.moveTo(sx + sway, top - hp * 0.12);
          ctx.lineTo(sx + half, base);
          ctx.lineTo(sx + half * 0.3, base);
          ctx.fill();
          if (P.snowCaps) {
            ctx.fillStyle = mix([250, 252, 255], P.fog, fog * 0.6);
            ctx.beginPath();
            ctx.moveTo(sx + sway, top - hp * 0.12);
            ctx.lineTo(sx + half * 0.35, top + hp * 0.02);
            ctx.lineTo(sx - half * 0.35, top + hp * 0.02);
            ctx.fill();
          }
        }
      } else {
        // leafy tree: a few overlapping blobs
        const cy = sy - hp * 0.68;
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = mix(P.leafy, P.fog, fog, tr.shade * 0.5 + (k === 3 ? 0.08 : 0) - k * 0.015);
          ctx.beginPath();
          const ox = [0, -0.28, 0.28, 0.1][k] * wp + sway, oy = [0, 0.12, 0.1, -0.16][k] * hp, r = [0.45, 0.32, 0.32, 0.26][k] * wp;
          ctx.arc(sx + ox, cy + oy, r, 0, 6.29);
          ctx.fill();
        }
      }
    }

    // light rays through the canopy
    if (P.rays) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 4; i++) {
        const x0 = W * (0.45 + i * 0.12) + Math.sin(t * 0.6 + i) * 20;
        const g = ctx.createLinearGradient(x0, 0, x0 - W * 0.25, H);
        g.addColorStop(0, 'rgba(255,246,214,.22)');
        g.addColorStop(1, 'rgba(255,246,214,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0, -10);
        ctx.lineTo(x0 + 40 + i * 10, -10);
        ctx.lineTo(x0 - W * 0.25 + 120, H);
        ctx.lineTo(x0 - W * 0.25, H);
        ctx.fill();
      }
      ctx.restore();
    }

    // particles
    for (const p of parts) {
      if (P.particles === 'leaves') {
        p.y += (22 + 30 * p.z) / 60;
        p.x += Math.sin(t * 2 + p.s) * 0.8 - 0.4;
        if (p.y > H + 10) (p.y = -10), (p.x = Math.random() * W);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 2 + p.s);
        ctx.scale(1, Math.sin(t * 3 + p.t));
        ctx.fillStyle = p.s > 3 ? '#d9a441' : '#b8c24a';
        ctx.fillRect(-4 * p.z, -2 * p.z, 8 * p.z, 4 * p.z);
        ctx.restore();
      } else if (P.particles === 'snow') {
        p.y += (25 + 45 * p.z) / 60;
        p.x += Math.sin(t + p.s) * 0.5;
        if (p.y > H + 5) (p.y = -5), (p.x = Math.random() * W);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2 + 2 * p.z, 0, 6.29);
        ctx.fill();
      } else {
        const a = 0.5 + 0.5 * Math.sin(t * 3 + p.t);
        p.x += Math.sin(t * 0.9 + p.s) * 0.6;
        p.y += Math.cos(t * 0.7 + p.s) * 0.4;
        const r = 2 + 3 * p.z;
        const g = ctx.createRadialGradient(p.x, p.y + H * 0.15, 0, p.x, p.y + H * 0.15, r * 4);
        g.addColorStop(0, `rgba(255,236,140,${0.9 * a})`);
        g.addColorStop(1, 'rgba(255,236,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r * 4, p.y + H * 0.15 - r * 4, r * 8, r * 8);
      }
    }

    // soft vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}
