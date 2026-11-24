/** Scratch notes: freehand drawing on graph paper, or typed notes. */
import { $, $$, cssVar } from './dom';

interface Stroke {
  color: string;
  erase: boolean;
  pts: { x: number; y: number }[];
}

export interface Notepad {
  clear(): void;
  resize(): void;
  redraw(): void;
}

export function initNotepad(): Notepad {
  const cv = $<HTMLCanvasElement>('#pad');
  const ctx = cv.getContext('2d')!;
  const typed = $<HTMLTextAreaElement>('#typed');
  const hint = $('#padhint');
  const eraser = $('#eraser');
  const swatches = $$('.sw');
  let strokes: Stroke[] = [];
  let cur: Stroke | null = null;
  let color = 'ink';
  let erasing = false;

  function resize() {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    const d = devicePixelRatio || 1;
    cv.width = r.width * d;
    cv.height = r.height * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    redraw();
  }

  function drawStroke(s: Stroke) {
    const p = s.pts;
    ctx.save();
    ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.erase ? '#000' : cssVar('--pen-' + s.color);
    ctx.lineWidth = s.erase ? 24 : 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    if (p.length === 1) ctx.lineTo(p[0].x + 0.1, p[0].y + 0.1);
    for (let i = 1; i < p.length - 1; i++) ctx.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
    if (p.length > 1) ctx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
    ctx.stroke();
    ctx.restore();
  }

  function redraw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    strokes.forEach(drawStroke);
    if (cur) drawStroke(cur);
    hint.style.opacity = strokes.length || cur ? '0' : '1';
  }

  const pos = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    cur = { color, erase: erasing, pts: [pos(e)] };
    redraw();
  });
  cv.addEventListener('pointermove', (e) => {
    if (!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) cur.pts.push(pos(ev));
    redraw();
  });
  const end = () => {
    if (cur) {
      strokes.push(cur);
      cur = null;
      redraw();
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);

  const undo = () => {
    strokes.pop();
    redraw();
  };
  function clear() {
    strokes = [];
    cur = null;
    redraw();
    typed.value = '';
  }

  $('#clearPad').onclick = clear;
  $('#undo').onclick = undo;
  swatches.forEach(
    (b) =>
      (b.onclick = () => {
        color = b.dataset.color!;
        erasing = false;
        eraser.setAttribute('aria-pressed', 'false');
        swatches.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      }),
  );
  eraser.onclick = () => {
    erasing = !erasing;
    eraser.setAttribute('aria-pressed', String(erasing));
    swatches.forEach((x) => x.setAttribute('aria-pressed', String(!erasing && x.dataset.color === color)));
  };
  const modes = $$('.seg button');
  modes.forEach(
    (b) =>
      (b.onclick = () => {
        const typing = b.dataset.mode === 'type';
        modes.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        typed.hidden = !typing;
        cv.style.pointerEvents = typing ? 'none' : '';
        $('#drawTools').style.display = typing ? 'none' : 'contents';
        hint.hidden = typing;
        if (typing) typed.focus();
      }),
  );
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !(e.target as Element).matches('input,textarea')) {
      e.preventDefault();
      undo();
    }
  });
  new ResizeObserver(resize).observe($('#padwrap'));
  return { clear, resize, redraw };
}
