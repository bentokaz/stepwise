/** Graphing calculator: up to three y = … expressions, drag to pan, wheel or buttons to zoom, hover to read points. */
import { compile, type Fn } from '../math/expr';
import { N, V } from '../math/html';
import { $, cssVar } from './dom';

export interface Graph {
  resize(): void;
  draw(): void;
}

const COLORS = ['--pen-teal', '--pen-red', '--pen-ink'];

export function initGraph(): Graph {
  const cv = $<HTMLCanvasElement>('#gcv');
  const ctx = cv.getContext('2d')!;
  const G = {
    cx: 0,
    cy: 0,
    s: 30, // pixels per unit
    hx: null as number | null,
    drag: null as null | { x: number; y: number; cx: number; cy: number },
    ex: ['2x + 1', 'x^2 − 3', ''],
    f: [] as (Fn | null)[],
  };

  const box = $('#gx');
  box.innerHTML = G.ex
    .map(
      (v, i) =>
        `<label><i style="background:var(${COLORS[i]})"></i><span>${V('y')} =</span><input id="gx${i}" value="${v}" placeholder="${i === 2 ? 'type an expression, e.g. −0.5x + 4' : ''}" spellcheck="false" autocomplete="off" aria-label="Expression ${i + 1}"><span class="err" id="ge${i}"></span></label>`,
    )
    .join('');
  function comp(i: number) {
    try {
      G.f[i] = compile(G.ex[i]);
      $('#ge' + i).textContent = '';
    } catch {
      G.f[i] = null;
      $('#ge' + i).textContent = 'Can’t read this';
    }
  }
  G.ex.forEach((_, i) => {
    const el = $<HTMLInputElement>('#gx' + i);
    el.oninput = () => {
      G.ex[i] = el.value;
      comp(i);
      draw();
    };
    comp(i);
  });

  function resize() {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const d = devicePixelRatio || 1;
    cv.width = r.width * d;
    cv.height = r.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    draw();
  }

  const label = (v: number) => N(Math.round(v * 1e6) / 1e6);

  function draw() {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    const X = (x: number) => w / 2 + (x - G.cx) * G.s;
    const Y = (y: number) => h / 2 - (y - G.cy) * G.s;
    ctx.clearRect(0, 0, w, h);
    // grid spacing of 1, 2 or 5 × 10^k, at least ~42px apart
    const raw = 42 / G.s, pw = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((m) => m * pw).find((v) => v >= raw)!;
    const x0 = G.cx - w / 2 / G.s, x1 = G.cx + w / 2 / G.s, y0 = G.cy - h / 2 / G.s, y1 = G.cy + h / 2 / G.s;
    const xs: number[] = [], ys: number[] = [];
    for (let k = Math.ceil(x0 / step); k * step <= x1; k++) xs.push(k * step);
    for (let k = Math.ceil(y0 / step); k * step <= y1; k++) ys.push(k * step);

    ctx.lineWidth = 1;
    ctx.strokeStyle = cssVar('--grid');
    ctx.beginPath();
    for (const x of xs) {
      ctx.moveTo(Math.round(X(x)) + 0.5, 0);
      ctx.lineTo(Math.round(X(x)) + 0.5, h);
    }
    for (const y of ys) {
      ctx.moveTo(0, Math.round(Y(y)) + 0.5);
      ctx.lineTo(w, Math.round(Y(y)) + 0.5);
    }
    ctx.stroke();
    ctx.strokeStyle = cssVar('--ink-2');
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, Y(0));
    ctx.lineTo(w, Y(0));
    ctx.moveTo(X(0), 0);
    ctx.lineTo(X(0), h);
    ctx.stroke();

    ctx.fillStyle = cssVar('--muted');
    ctx.font = '10px "JetBrains Mono",monospace';
    const ay = Math.min(Math.max(Y(0) + 13, 13), h - 4), ax = Math.min(Math.max(X(0) - 5, 26), w - 4);
    ctx.textAlign = 'center';
    for (const x of xs) if (Math.abs(x) > step / 2) ctx.fillText(label(x), X(x), ay);
    ctx.textAlign = 'right';
    for (const y of ys) if (Math.abs(y) > step / 2) ctx.fillText(label(y), ax, Y(y) + 3);

    G.f.forEach((f, i) => {
      if (!f) return;
      ctx.strokeStyle = cssVar(COLORS[i]);
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let pen = false, py = 0;
      for (let px = 0; px <= w; px++) {
        const y = f(G.cx + (px - w / 2) / G.s), sy = Y(y);
        if (!isFinite(y)) {
          pen = false;
          continue;
        }
        if (pen && Math.abs(sy - py) > h * 2) pen = false; // asymptote: don't join
        if (!pen) {
          ctx.moveTo(px, sy);
          pen = true;
        } else ctx.lineTo(px, sy);
        py = sy;
      }
      ctx.stroke();
    });

    if (G.hx != null) {
      const x = G.cx + (G.hx - w / 2) / G.s;
      ctx.font = '500 11px "JetBrains Mono",monospace';
      ctx.textAlign = 'left';
      G.f.forEach((f, i) => {
        if (!f) return;
        const y = f(x);
        if (!isFinite(y)) return;
        const sx = X(x), sy = Y(y);
        if (sy < -20 || sy > h + 20) return;
        ctx.fillStyle = cssVar(COLORS[i]);
        ctx.fillRect(sx - 4, sy - 4, 8, 8);
        const t = `(${x.toFixed(2)}, ${y.toFixed(2)})`, tw = ctx.measureText(t).width;
        const lx = Math.min(sx + 8, w - tw - 10), ly = Math.max(sy - 10, 14);
        ctx.fillStyle = cssVar('--surface');
        ctx.fillRect(lx - 3, ly - 11, tw + 6, 15);
        ctx.fillStyle = cssVar('--ink');
        ctx.fillText(t, lx, ly);
      });
    }
  }

  const px = (e: PointerEvent | WheelEvent) => e.clientX - cv.getBoundingClientRect().left;
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    G.drag = { x: e.clientX, y: e.clientY, cx: G.cx, cy: G.cy };
  });
  cv.addEventListener('pointermove', (e) => {
    if (G.drag) {
      G.cx = G.drag.cx - (e.clientX - G.drag.x) / G.s;
      G.cy = G.drag.cy + (e.clientY - G.drag.y) / G.s;
      G.hx = null;
    } else G.hx = px(e);
    draw();
  });
  cv.addEventListener('pointerup', () => (G.drag = null));
  cv.addEventListener('pointercancel', () => (G.drag = null));
  cv.addEventListener('pointerleave', () => {
    if (!G.drag) {
      G.hx = null;
      draw();
    }
  });
  function zoom(k: number, mx = cv.clientWidth / 2) {
    const w = cv.clientWidth, wx = G.cx + (mx - w / 2) / G.s;
    G.s = Math.min(600, Math.max(3, G.s * k));
    G.cx = wx - (mx - w / 2) / G.s;
    draw();
  }
  cv.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, px(e));
    },
    { passive: false },
  );
  $('#gin').onclick = () => zoom(1.4);
  $('#gout').onclick = () => zoom(1 / 1.4);
  $('#ghome').onclick = () => {
    G.cx = 0;
    G.cy = 0;
    G.s = 30;
    draw();
  };
  new ResizeObserver(resize).observe($('#gwrap'));
  return { resize, draw };
}
