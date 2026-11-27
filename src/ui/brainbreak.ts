/**
 * Brain breaks: every 10 minutes of engaged work earns a 2-minute break. Breaks stack (up to 6),
 * so there's no rush to spend one. A break only starts when you click the button; then you pick
 * a quick game, and when the timer runs out you go straight back to work.
 * "Engaged" = a lesson is open, the tab is visible, and you've typed, clicked or tapped in the last minute.
 */
import { S, save } from '../state';
import { $ } from './dom';
import { sfx } from './sound';

const EARN_SEC = 600;
const BREAK_SEC = 120;
const MAX = 6;
const IDLE_SEC = 60;

let lastInput = 0;
/** True if the student typed, clicked or tapped within the last `ms` and the tab is visible. */
export const recentlyActive = (ms: number): boolean => !document.hidden && Date.now() - lastInput < ms;
let isPractising: () => boolean = () => false;
let onChange: () => void = () => {};

export const breaksBanked = () => S.breaks ?? 0;
/** 0…1 progress towards the next break. */
export const breakProgress = () => (breaksBanked() >= MAX ? 1 : (S.workSec ?? 0) / EARN_SEC);

export function initBrainBreaks(practising: () => boolean, changed: () => void): void {
  isPractising = practising;
  onChange = changed;
  for (const ev of ['keydown', 'pointerdown'] as const) addEventListener(ev, () => (lastInput = Date.now()), true);
  setInterval(tick, 1000);
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-break]')) startBreak();
  });
  $('#bb').addEventListener('click', (e) => {
    const g = (e.target as Element).closest<HTMLElement>('[data-game]');
    if (g) play(g.dataset.game as 'stack' | 'tap');
    if ((e.target as Element).closest('[data-bb-end]')) endBreak();
  });
}

let saveCount = 0;
function tick() {
  if (!$('#bb').hidden) return;
  if (!isPractising() || document.hidden || Date.now() - lastInput > IDLE_SEC * 1000) return;
  if (breaksBanked() >= MAX) return;
  S.workSec = (S.workSec ?? 0) + 1;
  if (S.workSec >= EARN_SEC) {
    S.workSec -= EARN_SEC;
    S.breaks = breaksBanked() + 1;
    save();
    sfx.step();
  } else if (++saveCount % 15 === 0) save();
  onChange();
}

/** Header button: shows banked breaks and progress to the next one. */
export function breakButtonHTML(): string {
  const n = breaksBanked();
  const pct = Math.round(breakProgress() * 100);
  return `<span class="bbn tnum">${n}</span><span class="bbbar"><i style="width:${pct}%"></i></span>`;
}

/* ---------------- the break itself ---------------- */

let timer = 0;
let endAt = 0;
let stopGame: (() => void) | null = null;

function startBreak() {
  if (breaksBanked() < 1) {
    sfx.bad();
    const box = $('#bbNone');
    box.hidden = false;
    const left = Math.ceil((EARN_SEC - (S.workSec ?? 0)) / 60);
    box.textContent = `No breaks banked yet. Keep working: your next one is about ${left} minute${left === 1 ? '' : 's'} of practice away.`;
    setTimeout(() => (box.hidden = true), 3500);
    return;
  }
  S.breaks = breaksBanked() - 1;
  save();
  onChange();
  sfx.win();
  endAt = Date.now() + BREAK_SEC * 1000;
  $('#bb').hidden = false;
  $('#bbStage').innerHTML = `<div class="bb-pick"><h2>Brain break</h2><p>Two minutes. Pick a game.</p>
    <div class="bb-games">
      <button class="bb-game" data-game="stack"><b>Stacker</b><span>Drop each block on the one below. Overhangs get cut off.</span></button>
      <button class="bb-game" data-game="tap"><b>Quick tap</b><span>Hit the lit squares as fast as you can.</span></button>
    </div></div>`;
  clearInterval(timer);
  timer = window.setInterval(clock, 250);
  clock();
}

function clock() {
  const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  $('#bbClock').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  if (left <= 0) {
    clearInterval(timer);
    stopGame?.();
    stopGame = null;
    $('#bbStage').innerHTML = `<div class="bb-pick"><h2>Break over</h2><p>Back to it. Your next break is ${breaksBanked() ? 'already banked' : '10 minutes of work away'}.</p><button class="btn primary" data-bb-end>Back to work</button></div>`;
    sfx.done();
  }
}

function endBreak() {
  clearInterval(timer);
  stopGame?.();
  stopGame = null;
  $('#bb').hidden = true;
  onChange();
}

function play(game: 'stack' | 'tap') {
  stopGame?.();
  const stage = $('#bbStage');
  stage.innerHTML = '';
  stopGame = game === 'stack' ? stacker(stage) : quickTap(stage);
}

/* ---------------- Stacker ---------------- */

function stacker(stage: HTMLElement): () => void {
  stage.innerHTML = `<div class="bbg"><div class="bbg-top"><span>Height <b class="tnum" id="stH">0</b></span><span>Best <b class="tnum" id="stB">${S.bestStack ?? 0}</b></span></div>
    <div class="stk" id="stk"></div><p class="bbg-hint">Click, tap or press Space to drop.</p></div>`;
  const box = $('#stk');
  const ROWS = 12;
  const W = 100; // width in % units
  type Row = { x: number; w: number; el: HTMLElement };
  let rows: Row[] = [];
  let cur: Row;
  let dir = 1, speed = 45, over = false, raf = 0, prev = performance.now();

  const rowH = () => box.clientHeight / ROWS;
  function place(r: Row, i: number) {
    r.el.style.left = r.x + '%';
    r.el.style.width = r.w + '%';
    const vis = Math.max(0, rows.length - (ROWS - 3));
    r.el.style.bottom = (i - vis) * rowH() + 'px';
    r.el.style.height = rowH() - 2 + 'px';
  }
  function layout() {
    rows.forEach(place);
    place(cur, rows.length);
  }
  function newRow() {
    const w = rows.length ? rows[rows.length - 1].w : 40;
    const el = document.createElement('i');
    el.className = 'stb cur';
    box.appendChild(el);
    cur = { x: dir > 0 ? 0 : W - w, w, el };
    layout();
  }
  function reset() {
    box.innerHTML = '';
    rows = [];
    dir = 1;
    speed = 45;
    over = false;
    const el = document.createElement('i');
    el.className = 'stb';
    box.appendChild(el);
    rows.push({ x: 30, w: 40, el });
    $('#stH').textContent = '0';
    newRow();
  }
  function drop() {
    if (over) return reset();
    const below = rows[rows.length - 1];
    const l = Math.max(cur.x, below.x), r = Math.min(cur.x + cur.w, below.x + below.w);
    if (r - l <= 0.5) {
      over = true;
      cur.el.classList.add('miss');
      sfx.bad();
      $('#stH').textContent = `${rows.length - 1} · tap to retry`;
      return;
    }
    // cut the overhang; land exactly on the block below for a perfect drop
    const perfect = Math.abs(cur.x - below.x) < 1.2;
    if (perfect) cur.x = below.x;
    else {
      cur.x = l;
      cur.w = r - l;
    }
    cur.el.classList.remove('cur');
    if (perfect) cur.el.classList.add('perfect');
    rows.push(cur);
    sfx[perfect ? 'step' : 'tap']();
    const h = rows.length - 1;
    $('#stH').textContent = String(h);
    if (h > (S.bestStack ?? 0)) {
      S.bestStack = h;
      $('#stB').textContent = String(h);
      save();
    }
    speed = Math.min(140, speed + 4);
    dir = -dir;
    newRow();
  }
  function frame(now: number) {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!over) {
      cur.x += dir * speed * dt;
      if (cur.x <= 0) (cur.x = 0), (dir = 1);
      if (cur.x + cur.w >= W) (cur.x = W - cur.w), (dir = -1);
      place(cur, rows.length);
    }
    raf = requestAnimationFrame(frame);
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      drop();
    }
  };
  box.addEventListener('pointerdown', drop);
  addEventListener('keydown', onKey, true);
  reset();
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('keydown', onKey, true);
  };
}

/* ---------------- Quick tap ---------------- */

function quickTap(stage: HTMLElement): () => void {
  stage.innerHTML = `<div class="bbg"><div class="bbg-top"><span>Score <b class="tnum" id="qtS">0</b></span><span>Best <b class="tnum" id="qtB">${S.bestTap ?? 0}</b></span></div>
    <div class="qt" id="qt">${'<button class="qtc"></button>'.repeat(16)}</div><p class="bbg-hint">Hit lit squares. Missing one, or hitting a dark one, resets your combo.</p></div>`;
  const cells = [...stage.querySelectorAll<HTMLButtonElement>('.qtc')];
  let score = 0, combo = 0, life = 1100, lit = -1, litAt = 0, raf = 0;
  const light = () => {
    let i;
    do i = Math.floor(Math.random() * 16);
    while (i === lit);
    if (lit >= 0) cells[lit].classList.remove('on');
    lit = i;
    litAt = performance.now();
    cells[i].classList.add('on');
  };
  const show = () => {
    $('#qtS').textContent = combo > 1 ? `${score} ×${Math.min(combo, 5)}` : String(score);
    if (score > (S.bestTap ?? 0)) {
      S.bestTap = score;
      $('#qtB').textContent = String(score);
      save();
    }
  };
  cells.forEach((c, i) =>
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (i === lit) {
        combo++;
        score += Math.min(combo, 5);
        life = Math.max(450, life - 15);
        sfx.tap();
        c.classList.add('hit');
        setTimeout(() => c.classList.remove('hit'), 160);
        light();
      } else {
        combo = 0;
        sfx.bad();
        c.classList.add('wrong');
        setTimeout(() => c.classList.remove('wrong'), 200);
      }
      show();
    }),
  );
  const frame = (now: number) => {
    if (now - litAt > life) {
      combo = 0;
      show();
      light();
    }
    raf = requestAnimationFrame(frame);
  };
  light();
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
