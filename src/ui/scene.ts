/**
 * Success scenes: a forest with a stream that you can walk around in, drawn live on a canvas
 * (no image files). WASD / arrow keys or dragging to move and look; touch: drag up to walk, sideways to turn.
 * Trees and grass are generated per cell as you go, so the forest never ends. Glowing orbs are hidden
 * nearby (+1 XP each). If nothing is touched it closes by itself after a few seconds.
 */
import { S, save } from '../state';
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

/* ---------- world: trees and grass generated per 8 m cell, the same every time you pass ---------- */

interface Tree {
  x: number;
  z: number;
  h: number;
  w: number;
  kind: 0 | 1 | 2; // pine, leafy, grass tuft
  shade: number;
}

const CELL = 8;
let worldSeed = 1;
const cellCache = new Map<string, Tree[]>();

function cellTrees(cx: number, cz: number): Tree[] {
  const key = cx + ',' + cz;
  let out = cellCache.get(key);
  if (out) return out;
  let s = (Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ worldSeed) >>> 0 || 1;
  const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)), ((s >>>= 0) % 100000) / 100000);
  out = [];
  const n = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < n + 5; i++) {
    const x = (cx + rnd()) * CELL, z = (cz + rnd()) * CELL;
    const inWater = Math.abs(x - streamX(z)) < streamW(z) + (i < n ? 1.3 : 0.3);
    const nearStart = Math.hypot(x - START.x, z - START.z) < (i < n ? 3 : 0);
    if (inWater || nearStart) continue;
    if (i < n) {
      const kind = rnd() < 0.62 ? 0 : 1;
      const h = kind ? 6 + rnd() * 6 : 8 + rnd() * 9;
      out.push({ x, z, h, w: h * (kind ? 0.45 : 0.28), kind, shade: rnd() * 0.25 - 0.1 });
    } else out.push({ x, z, h: 0.35 + rnd() * 0.3, w: 0.5, kind: 2, shade: rnd() * 0.3 - 0.1 });
  }
  cellCache.set(key, out);
  return out;
}

const START = { x: streamX(4) - 3, z: 0 };

const mix = (a: [number, number, number], b: [number, number, number], t: number, d = 0) =>
  `rgb(${Math.round((a[0] + d * 255) * (1 - t) + b[0] * t)},${Math.round((a[1] + d * 255) * (1 - t) + b[1] * t)},${Math.round((a[2] + d * 255) * (1 - t) + b[2] * t)})`;

/* ---------- sound: a babbling stream (looping) and birds or crickets now and then ---------- */

function ambience(kind: SceneId): () => void {
  if (!S.sound) return () => {};
  try {
    const ac = new AudioContext();
    const t0 = ac.currentTime;
    const len = ac.sampleRate * 4;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
      d[i] = last * 3.2;
    }
    // crossfade the loop point so it doesn't click
    for (let i = 0; i < 2000; i++) d[len - 2000 + i] = d[len - 2000 + i] * (1 - i / 2000) + d[i] * (i / 2000);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.6;
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = 350;
    lfo.connect(lg).connect(bp.frequency);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.45, t0 + 0.4);
    src.connect(bp).connect(g).connect(ac.destination);
    src.start(t0);
    lfo.start(t0);
    const chirp = (t: number, f: number) => {
      const o = ac.createOscillator(), cg = ac.createGain();
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.45, t + 0.09);
      cg.gain.setValueAtTime(0, t);
      cg.gain.linearRampToValueAtTime(0.03, t + 0.01);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      o.connect(cg).connect(ac.destination);
      o.start(t);
      o.stop(t + 0.12);
    };
    const song = () => {
      const t = ac.currentTime + 0.05;
      if (kind === 'dusk') for (let i = 0; i < 4; i++) chirp(t + i * 0.25, 4200);
      else if (kind === 'forest') {
        const f = 2400 + Math.random() * 1200;
        chirp(t, f);
        chirp(t + 0.14, f * 1.1);
        if (Math.random() < 0.5) chirp(t + 0.3, f * 0.95);
      }
    };
    setTimeout(song, 500);
    const iv = setInterval(song, 2200 + Math.random() * 1500);
    return () => {
      clearInterval(iv);
      const t = ac.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.3);
      setTimeout(() => ac.close(), 400);
    };
  } catch {
    return () => {};
  }
}

function orbSound() {
  if (!S.sound) return;
  try {
    const ac = new AudioContext(), t = ac.currentTime;
    [880, 1320, 1760].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.06);
      g.gain.linearRampToValueAtTime(0.06, t + i * 0.06 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.25);
      o.connect(g).connect(ac.destination);
      o.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.3);
    });
    setTimeout(() => ac.close(), 700);
  } catch {
    /* audio unavailable */
  }
}

/* ---------- the walk ---------- */

let running: (() => void) | null = null;
/** True while a scene is open (the practice screen ignores its own shortcuts then). */
export const sceneOpen = () => running !== null;

const ORBS = 5;

/**
 * Opens the forest. If the student doesn't touch anything it closes by itself after a few
 * seconds; once they start walking it stays until they press Enter/Esc or tap Done.
 */
export function playScene(kind: SceneId, word: string, sub: string): void {
  running?.();
  const P = PAL[kind];
  const fx = $('#fx');
  const touch = matchMedia('(pointer:coarse)').matches;

  const cv = document.createElement('canvas');
  cv.className = 'scene';
  cv.setAttribute('aria-label', 'Forest you can walk around in');
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let W = innerWidth, H = innerHeight;
  const size = () => {
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ctx = cv.getContext('2d')!;
  size();
  fx.appendChild(cv);

  const label = document.createElement('div');
  label.className = 'scene-word';
  label.innerHTML = `<svg viewBox="0 0 44 44" fill="none"><path d="M8 23l9 9L36 12" stroke="currentColor" stroke-width="5.5" stroke-linecap="square"/></svg><div><div class="big">${word}</div><div class="sub">${sub}</div></div>`;
  fx.appendChild(label);

  const hud = document.createElement('div');
  hud.className = 'scene-hud';
  hud.innerHTML = `<span class="scene-hint">${
    touch ? 'Drag to walk and look around' : '<b>WASD</b> or <b>arrow keys</b> to walk · drag to look · <b>Shift</b> to run'
  }</span><span class="scene-orbs tnum"></span><button class="btn primary sm scene-done">Done <span class="k">${touch ? '' : 'Enter'}</span></button>`;
  fx.appendChild(hud);
  const orbText = hud.querySelector<HTMLElement>('.scene-orbs')!;

  worldSeed = 1 + Math.floor(Math.random() * 1e6);
  cellCache.clear();
  const cam = { x: START.x, z: START.z, yaw: 0.12 };
  // glowing orbs to find, scattered within reach
  const orbs: { x: number; z: number; got: boolean; ph: number }[] = [];
  while (orbs.length < ORBS) {
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 22;
    const x = cam.x + Math.sin(a) * r, z = cam.z + 6 + Math.cos(a) * r;
    if (Math.abs(x - streamX(z)) < streamW(z) + 0.8) continue;
    orbs.push({ x, z, got: false, ph: Math.random() * 6 });
  }
  let found = 0;
  const showOrbs = () => (orbText.textContent = `✦ ${found}/${ORBS} orbs`);
  showOrbs();

  type P2 = { x: number; y: number; z: number; s: number; t: number };
  const parts: P2[] = [];
  const nParts = P.particles === 'fireflies' ? 40 : P.particles === 'snow' ? 140 : 26;
  for (let i = 0; i < nParts; i++)
    parts.push({ x: Math.random() * W, y: Math.random() * H, z: 0.4 + Math.random() * 0.8, s: Math.random() * 6.28, t: Math.random() * 6.28 });
  const sparkles = Array.from({ length: 90 }, () => ({ u: Math.random() * 2 - 1, z: Math.random() * 60, ph: Math.random() * 6.28 }));

  const stopSound = ambience(kind);

  /* ----- input ----- */
  const keys = new Set<string>();
  let interacted = false;
  let drag: { x: number; y: number; id: number; lastX: number } | null = null;
  let touchFwd = 0;
  const interact = () => {
    if (interacted) return;
    interacted = true;
    label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 600, fill: 'forwards' });
  };
  const MOVE = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'q', 'e'];
  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (e.type === 'keydown' && (k === 'enter' || k === 'escape' || k === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      return close();
    }
    if (!MOVE.includes(k)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'keydown') {
      keys.add(k);
      interact();
    } else keys.delete(k);
  };
  addEventListener('keydown', onKey, true);
  addEventListener('keyup', onKey, true);
  const blur = () => keys.clear();
  addEventListener('blur', blur);
  cv.addEventListener('pointerdown', (e) => {
    interact();
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, lastX: e.clientX };
    try {
      cv.setPointerCapture(e.pointerId);
    } catch {
      /* pointer gone */
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    cam.yaw += (e.clientX - drag.lastX) * (e.pointerType === 'mouse' ? 0.005 : 0.007);
    drag.lastX = e.clientX;
    // touch: dragging up walks forward, down walks back
    if (e.pointerType !== 'mouse') touchFwd = Math.max(-1, Math.min(1, (drag.y - e.clientY) / 70));
  });
  const endDrag = () => {
    drag = null;
    touchFwd = 0;
  };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', (e) => {
    interact();
    e.preventDefault();
    cam.yaw += e.deltaX * 0.003;
  });
  hud.querySelector<HTMLButtonElement>('.scene-done')!.onclick = () => close();
  addEventListener('resize', size);

  let raf = 0;
  const auto = setTimeout(() => {
    if (!interacted) close();
  }, 3400);

  function close() {
    if (running !== close) return;
    running = null;
    clearTimeout(auto);
    cancelAnimationFrame(raf);
    removeEventListener('keydown', onKey, true);
    removeEventListener('keyup', onKey, true);
    removeEventListener('blur', blur);
    removeEventListener('resize', size);
    stopSound();
    for (const el of [cv, label, hud]) {
      el.style.pointerEvents = 'none';
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
      setTimeout(() => el.remove(), 300); // a timer, not onfinish: animations can stall in background tabs
    }
    if (found) {
      S.xp += found;
      save();
      dispatchEvent(new CustomEvent('stepwise:xp', { detail: found }));
    }
  }
  running = close;

  cv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320 });
  label.animate(
    [
      { opacity: 0, transform: 'translate(-50%,-40%) scale(.92)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
    ],
    { duration: 450, delay: 150, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' },
  );

  /* ----- simulation + drawing ----- */
  const start = performance.now();
  let prev = start;
  let stepPhase = 0;
  let lastYaw = cam.yaw;
  const near: Tree[] = [];

  function blocked(x: number, z: number) {
    if (Math.abs(x - streamX(z)) < streamW(z) + 0.15) return true;
    for (const t of near) if (t.kind !== 2 && Math.hypot(t.x - x, t.z - z) < 0.55) return true;
    return false;
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - start) / 1000;

    // movement
    const turn = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    let fwd = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0) + touchFwd;
    const strafe = (keys.has('e') ? 1 : 0) - (keys.has('q') ? 1 : 0);
    if (!interacted) fwd = 0.45; // drift forward gently until the student takes over
    cam.yaw += turn * 1.9 * dt;
    const speed = (keys.has('shift') ? 6 : 3) * dt;
    const sn = Math.sin(cam.yaw), cs = Math.cos(cam.yaw);
    const mx = (sn * fwd + cs * strafe) * speed, mz = (cs * fwd - sn * strafe) * speed;
    const moving = Math.abs(fwd) + Math.abs(strafe) > 0.05;
    if (!blocked(cam.x + mx, cam.z)) cam.x += mx;
    if (!blocked(cam.x, cam.z + mz)) cam.z += mz;
    if (moving) stepPhase += dt * (keys.has('shift') ? 11 : 7.5);
    const bob = moving ? Math.sin(stepPhase) * 0.035 : 0;

    // orbs
    for (const o of orbs)
      if (!o.got && Math.hypot(o.x - cam.x, o.z - cam.z) < 1.1) {
        o.got = true;
        found++;
        showOrbs();
        orbSound();
        orbText.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 300 });
      }

    const f = Math.max(W, H * 1.1) * 0.75;
    const eye = 1.7 + bob;
    const hY = H * 0.43;
    const view = (x: number, z: number) => {
      const dx = x - cam.x, dz = z - cam.z;
      return { rx: dx * cs - dz * sn, rz: dx * sn + dz * cs };
    };
    const scr = (rx: number, rz: number, y: number) => ({ sx: W / 2 + (rx / rz) * f, sy: hY + ((eye - y) / rz) * f });

    // sky with a sun fixed in the world
    const sky = ctx.createLinearGradient(0, 0, 0, hY);
    sky.addColorStop(0, P.skyTop);
    sky.addColorStop(1, P.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, hY + 2);
    const sunD = Math.atan2(Math.sin(0.35 - cam.yaw), Math.cos(0.35 - cam.yaw)); // 0 = straight ahead
    const sunX = W / 2 + Math.tan(Math.max(-1.3, Math.min(1.3, sunD))) * f;
    const sunVis = Math.abs(sunD) < 1.3;
    if (sunVis) {
      const sun = ctx.createRadialGradient(sunX, hY * 0.55, 0, sunX, hY * 0.55, W * 0.5);
      sun.addColorStop(0, P.sun);
      sun.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, hY + 2);
    }
    if (kind === 'dusk') {
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 60; i++) {
        const a = (i * 0.618 * Math.PI * 2) % (Math.PI * 2);
        let d = a - cam.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        if (Math.abs(d) > 1.2) continue;
        const sx = W / 2 + Math.tan(d) * f, sy = ((i * 89.7) % (hY * 0.6)) + 4;
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

    // distant treeline: a ridge that wraps all the way round
    ctx.fillStyle = mix(P.pine, P.fog, 0.78);
    ctx.beginPath();
    ctx.moveTo(0, hY + 2);
    for (let x = 0; x <= W; x += 8) {
      const a = cam.yaw + Math.atan((x - W / 2) / f);
      ctx.lineTo(x, hY - 16 - 20 * Math.abs(Math.sin(a * 7 + 1.7)) - 9 * Math.sin(a * 23) - 6 * Math.sin(a * 41 + 2));
    }
    ctx.lineTo(W, hY + 2);
    ctx.fill();

    // stream: quads along its length, clipped at the near plane
    const NEAR = 0.25;
    const quad = (pts: { rx: number; rz: number }[]) => {
      const out: { rx: number; rz: number }[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if (a.rz >= NEAR) out.push(a);
        if (a.rz >= NEAR !== b.rz >= NEAR) {
          const k = (NEAR - a.rz) / (b.rz - a.rz);
          out.push({ rx: a.rx + (b.rx - a.rx) * k, rz: NEAR });
        }
      }
      if (out.length < 3) return;
      out.forEach((p, i) => {
        const s = scr(p.rx, p.rz, 0);
        if (i) ctx.lineTo(s.sx, s.sy);
        else ctx.moveTo(s.sx, s.sy);
      });
      ctx.closePath();
    };
    const drawStream = (pad: number) => {
      ctx.beginPath();
      const z0 = Math.floor(cam.z - 70);
      for (let z = z0; z < cam.z + 90; z += 1.5) {
        const a = streamX(z), b = streamX(z + 1.5), wa = streamW(z) + pad, wb = streamW(z + 1.5) + pad;
        quad([view(a - wa, z), view(a + wa, z), view(b + wb, z + 1.5), view(b - wb, z + 1.5)]);
      }
    };
    ctx.fillStyle = P.bank;
    drawStream(0.25);
    ctx.fill();
    const wg = ctx.createLinearGradient(0, hY, 0, H);
    wg.addColorStop(0, P.water);
    wg.addColorStop(1, P.waterDeep);
    ctx.fillStyle = wg;
    drawStream(0);
    ctx.fill();
    // sparkles flow downstream (towards −z)
    ctx.fillStyle = P.shine;
    for (const s of sparkles) {
      const z = cam.z - 20 + ((((s.z - t * 2.4) % 60) + 60) % 60);
      const v = view(streamX(z) + s.u * streamW(z) * 0.85, z);
      if (v.rz < 0.6) continue;
      const p = scr(v.rx, v.rz, 0), k = Math.min(1, 6 / v.rz);
      ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(t * 4 + s.ph))) * Math.min(1, v.rz / 2);
      ctx.fillRect(p.sx - 6 * k, p.sy, 12 * k + 1, Math.max(1, 1.6 * k));
    }
    ctx.globalAlpha = 1;

    // mist at the horizon
    const mist = ctx.createLinearGradient(0, hY - 60, 0, hY + 40);
    const [fr, fg, fb] = P.fog;
    mist.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
    mist.addColorStop(0.6, `rgba(${fr},${fg},${fb},.55)`);
    mist.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
    ctx.fillStyle = mist;
    ctx.fillRect(0, hY - 60, W, 100);

    // gather nearby trees, grass and orbs
    near.length = 0;
    const R = 60;
    const ccx = Math.floor(cam.x / CELL), ccz = Math.floor(cam.z / CELL), rc = Math.ceil(R / CELL);
    type Obj = { rz: number; sx: number; sy: number; tr?: Tree; orb?: (typeof orbs)[number] };
    const objs: Obj[] = [];
    for (let i = -rc; i <= rc; i++)
      for (let j = -rc; j <= rc; j++)
        for (const tr of cellTrees(ccx + i, ccz + j)) {
          if (Math.abs(tr.x - cam.x) < 2 && Math.abs(tr.z - cam.z) < 2) near.push(tr);
          const v = view(tr.x, tr.z);
          if (v.rz < 0.35 || v.rz > (tr.kind === 2 ? 22 : R)) continue;
          const p = scr(v.rx, v.rz, 0);
          if (p.sx < -W * 0.6 || p.sx > W * 1.6) continue;
          objs.push({ rz: v.rz, sx: p.sx, sy: p.sy, tr });
        }
    for (const o of orbs) {
      if (o.got) continue;
      const v = view(o.x, o.z);
      if (v.rz < 0.35) continue;
      const p = scr(v.rx, v.rz, 1.1 + 0.15 * Math.sin(t * 2 + o.ph));
      objs.push({ rz: v.rz, sx: p.sx, sy: p.sy, orb: o });
    }
    objs.sort((a, b) => b.rz - a.rz);

    for (const ob of objs) {
      const { rz, sx, sy } = ob;
      const fog = Math.min(0.92, 1 - Math.exp(-rz / 38));
      if (ob.orb) {
        const r = Math.max(3, (0.25 / rz) * f);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
        g.addColorStop(0, 'rgba(255,255,230,1)');
        g.addColorStop(0.25, kind === 'snow' ? 'rgba(140,200,255,.9)' : 'rgba(220,255,120,.9)');
        g.addColorStop(1, 'rgba(220,255,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(sx - r * 3, sy - r * 3, r * 6, r * 6);
        continue;
      }
      const tr = ob.tr!;
      const hp = (tr.h / rz) * f, wp = (tr.w / rz) * f;
      if (tr.kind === 2) {
        // grass tuft: three blades
        ctx.strokeStyle = mix(kind === 'snow' ? [190, 200, 205] : P.leafy, P.fog, fog, tr.shade);
        ctx.lineWidth = Math.max(1, (0.04 / rz) * f);
        ctx.beginPath();
        for (let k = -1; k <= 1; k++) {
          ctx.moveTo(sx + k * wp * 0.15, sy);
          ctx.lineTo(sx + k * wp * 0.4 + Math.sin(t * 2 + tr.x) * wp * 0.08, sy - hp * (1 - Math.abs(k) * 0.25));
        }
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = mix(P.trunk, P.fog, fog);
      ctx.fillRect(sx - wp * 0.07, sy - hp * (tr.kind ? 0.55 : 0.3), wp * 0.14, hp * (tr.kind ? 0.55 : 0.3));
      const sway = Math.sin(t * 1.3 + tr.x) * wp * 0.03;
      if (tr.kind === 0) {
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

    // light rays from the sun's direction
    if (P.rays && sunVis) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 4; i++) {
        const x0 = sunX + (i - 1.5) * W * 0.1 + Math.sin(t * 0.6 + i) * 20;
        const g = ctx.createLinearGradient(x0, 0, x0 - W * 0.25, H);
        g.addColorStop(0, 'rgba(255,246,214,.2)');
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

    // particles (screen space; they slide sideways as you turn)
    const slide = (cam.yaw - lastYaw) * f * 0.6;
    lastYaw = cam.yaw;
    for (const p of parts) {
      p.x -= slide * p.z;
      if (p.x < -10) p.x += W + 20;
      if (p.x > W + 10) p.x -= W + 20;
      if (P.particles === 'leaves') {
        p.y += ((22 + 30 * p.z) / 60) * (dt * 60);
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
        p.y += ((25 + 45 * p.z) / 60) * (dt * 60);
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
        if (p.y > H * 0.85) p.y = H * 0.1;
        if (p.y < 0) p.y = H * 0.8;
        const r = 2 + 3 * p.z;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        g.addColorStop(0, `rgba(255,236,140,${0.9 * a})`);
        g.addColorStop(1, 'rgba(255,236,140,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - r * 4, p.y - r * 4, r * 8, r * 8);
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
