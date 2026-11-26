/** Celebration effects drawn into the #fx layer (pointer-events: none, so they never block input). */
import { R, pick } from '../math/core';
import { $, reduceMotion } from './dom';

const layer = () => $('#fx');

/** Small burst of confetti from the right edge of an element. */
export function burstAt(el: Element): void {
  if (reduceMotion()) return;
  const r = el.getBoundingClientRect(), cx = r.right - 24, cy = r.top + r.height / 2;
  const cols = ['var(--lime)', 'var(--teal)', 'var(--ink)', 'var(--lime)'];
  for (let i = 0; i < 22; i++) {
    const d = document.createElement('i');
    d.className = 'spark';
    const wide = Math.random() < 0.5;
    d.style.cssText = `left:${cx}px;top:${cy}px;background:${cols[i % 4]};width:${wide ? 10 : 6}px;height:${wide ? 3 : 6}px`;
    layer().appendChild(d);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5, dist = 50 + Math.random() * 90;
    d.animate(
      [
        { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist + 30}px) rotate(${R(-260, 260)}deg)`, opacity: 0 },
      ],
      { duration: 650 + Math.random() * 350, easing: 'cubic-bezier(.15,.7,.3,1)' },
    ).onfinish = () => d.remove();
  }
}

/** "+12 XP" tag that drifts under the XP counter. */
export function floatXP(n: number, anchor: Element, text = `+${n} XP`): void {
  if (reduceMotion()) return;
  const r = anchor.getBoundingClientRect(), d = document.createElement('div');
  d.className = 'float';
  d.textContent = text;
  if (n < 0) d.classList.add('neg');
  d.style.left = Math.min(r.left - 10, innerWidth - 80) + 'px';
  d.style.top = r.bottom + 6 + 'px';
  layer().appendChild(d);
  d.animate(
    [
      { transform: 'translateY(-6px)', opacity: 0 },
      { transform: 'none', opacity: 1, offset: 0.2 },
      { transform: 'translateY(14px)', opacity: 0 },
    ],
    { duration: 1300, easing: 'ease-out' },
  ).onfinish = () => d.remove();
}

/** The success screens you can pick in Rewards. */
export type Screen = 'tiles' | 'shockwave' | 'stripes' | 'rain' | 'blinds' | 'curtain';

const EASE_IN = 'cubic-bezier(.2,.9,.3,1.12)';
const EASE_OUT = 'cubic-bezier(.55,0,.85,.35)';

/** One covering piece: pops in, holds while the word shows, then leaves. */
function piece(css: string, from: string, mid: string, to: string, delay: number): void {
  const t = document.createElement('i');
  t.className = 'tile';
  t.style.cssText = css;
  layer().appendChild(t);
  t.animate(
    [
      { transform: from, easing: EASE_IN },
      { transform: mid, offset: 0.2 },
      { transform: mid, offset: 0.62, easing: EASE_OUT },
      { transform: to },
    ],
    { duration: 1500, delay, fill: 'both' },
  ).onfinish = () => t.remove();
  setTimeout(() => t.remove(), 1500 + delay + 200); // in case animations stall in a background tab
}

/**
 * Full-screen win: the chosen screen covers the page from `origin`, a big check and word appear,
 * confetti flies from the center, then the screen clears.
 */
export function bigWin(origin: Element, gain: number, streak: number, first: boolean, screen: Screen = 'tiles'): void {
  const fx = layer();
  fx.querySelectorAll('.tile,.win').forEach((n) => n.remove());
  const W = innerWidth, H = innerHeight;
  const fr = origin.getBoundingClientRect(), ox = fr.left + fr.width / 2, oy = fr.top + fr.height / 2;
  const maxD = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
  const main = first ? 'var(--lime)' : 'var(--teal)', alt = first ? 'var(--teal)' : 'var(--lime)';

  if (screen === 'tiles') {
    const size = Math.ceil(Math.max(W, H) / 11), cols = Math.ceil(W / size), rows = Math.ceil(H / size);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const x = c * size, y = r * size, d = Math.hypot(x + size / 2 - ox, y + size / 2 - oy) / maxD;
        piece(
          `left:${x}px;top:${y}px;width:${size + 1}px;height:${size + 1}px;background:${Math.random() < 0.07 ? alt : main}`,
          'scale(0) rotate(45deg)',
          'scale(1) rotate(0)',
          'scale(0) rotate(-45deg)',
          d * 260,
        );
      }
  } else if (screen === 'shockwave') {
    // nested diamonds burst out of the answer box, the last one covers everything
    const size = 2 * maxD + 40;
    for (let i = 0; i < 5; i++)
      piece(
        `left:${ox - size / 2}px;top:${oy - size / 2}px;width:${size}px;height:${size}px;background:${i % 2 ? alt : main}`,
        'scale(0) rotate(45deg)',
        `scale(${i === 4 ? 1 : 1 - (4 - i) * 0.02}) rotate(45deg)`,
        'scale(0) rotate(45deg)',
        i * 70,
      );
  } else if (screen === 'stripes') {
    // slanted bars sweep in from the left and out to the right
    const n = 9, bw = W / n, slant = H * 0.27;
    for (let i = 0; i < n; i++)
      piece(
        `left:${i * bw - slant / 2 - 2}px;top:-2px;width:${bw + slant + 4}px;height:${H + 4}px;background:${i % 4 === 2 ? alt : main};transform-origin:50% 50%`,
        `translateX(${-W - slant * 2}px) skewX(-15deg)`,
        'translateX(0) skewX(-15deg)',
        `translateX(${W + slant * 2}px) skewX(-15deg)`,
        i * 40,
      );
  } else if (screen === 'rain') {
    // columns drop in from the top and fall out the bottom
    const n = 11, cw = W / n;
    for (let i = 0; i < n; i++)
      piece(
        `left:${i * cw - 1}px;top:0;width:${cw + 2}px;height:${H + 2}px;background:${i % 5 === 3 ? alt : main}`,
        `translateY(${-H - 20}px)`,
        'translateY(0)',
        `translateY(${H + 20}px)`,
        Math.abs(i - (ox / W) * n) * 35 + Math.random() * 40,
      );
  } else if (screen === 'blinds') {
    // vertical slats open from the middle outwards
    const n = 14, sw = W / n;
    for (let i = 0; i < n; i++)
      piece(
        `left:${i * sw - 1}px;top:0;width:${sw + 2}px;height:${H}px;background:${i % 2 ? main : 'color-mix(in srgb, ' + main + ' 88%, var(--ink))'}`,
        'scaleX(0)',
        'scaleX(1)',
        'scaleX(0)',
        Math.abs(i - (n - 1) / 2) * 32,
      );
  } else {
    // curtain: two halves meet in the middle, then lift away
    piece(`left:0;top:0;width:${W / 2 + 1}px;height:${H}px;background:${main}`, 'translateX(-101%)', 'translateX(0)', 'translateY(-101%)', 0);
    piece(`left:${W / 2}px;top:0;width:${W / 2}px;height:${H}px;background:${main}`, 'translateX(101%)', 'translateX(0)', 'translateY(-101%)', 60);
    piece(`left:${W / 2 - 4}px;top:0;width:8px;height:${H}px;background:${alt}`, 'scaleY(0)', 'scaleY(1)', 'translateY(-101%)', 160);
  }

  const words = first ? ['Correct', 'Nailed it', 'Clean', 'Yes', 'Perfect'] : ['Got it', 'There it is'];
  const w = document.createElement('div');
  w.className = 'win' + (first ? '' : ' alt');
  w.innerHTML = `<svg viewBox="0 0 44 44" fill="none"><path d="M8 23l9 9L36 12" stroke="currentColor" stroke-width="5.5" stroke-linecap="square"/></svg>
    <div class="big">${pick(words)}</div><div class="sub"><span>+${gain} XP</span>${streak > 1 ? `<span>${streak} in a row</span>` : ''}</div>`;
  fx.appendChild(w);
  w.animate(
    [
      { opacity: 0, transform: 'scale(.7)' },
      { opacity: 1, transform: 'scale(1.04)', offset: 0.22 },
      { opacity: 1, transform: 'scale(1)', offset: 0.55 },
      { opacity: 0, transform: 'scale(1.12)' },
    ],
    { duration: 1250, delay: 200, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' },
  ).onfinish = () => w.remove();
  w.querySelector('path')!.animate([{ strokeDashoffset: 60 }, { strokeDashoffset: 0 }], {
    duration: 420,
    delay: 330,
    easing: 'cubic-bezier(.6,0,.2,1)',
    fill: 'both',
  });
  w.querySelector('.big')!.animate([{ letterSpacing: '.08em' }, { letterSpacing: '-.05em' }], {
    duration: 600,
    delay: 200,
    easing: 'cubic-bezier(.2,.8,.2,1)',
    fill: 'both',
  });

  setTimeout(() => {
    const cs = ['var(--ink)', alt, 'var(--surface)'];
    for (let i = 0; i < 48; i++) {
      const d = document.createElement('i');
      d.className = 'spark';
      const big = Math.random() < 0.4;
      d.style.cssText = `left:${W / 2}px;top:${H / 2}px;background:${cs[i % 3]};width:${big ? 16 : 9}px;height:${big ? 5 : 9}px;z-index:2`;
      fx.appendChild(d);
      const a = Math.random() * Math.PI * 2, dist = Math.max(W, H) * (0.35 + Math.random() * 0.4);
      d.animate(
        [
          { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) rotate(${R(-400, 400)}deg)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.1,.7,.3,1)' },
      ).onfinish = () => d.remove();
    }
  }, 380);
}

/** Confetti falling from the top of the screen, for mastering a lesson. */
export function confettiRain(): void {
  if (reduceMotion()) return;
  const fx = layer();
  for (let i = 0; i < 60; i++) {
    const d = document.createElement('i');
    d.className = 'spark';
    d.style.cssText = `left:${Math.random() * innerWidth}px;top:-12px;background:${['var(--lime)', 'var(--teal)', 'var(--surface)'][i % 3]};width:${R(5, 10)}px;height:${R(3, 7)}px`;
    fx.appendChild(d);
    d.animate(
      [{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${R(-80, 80)}px,${innerHeight + 40}px) rotate(${R(-540, 540)}deg)` }],
      { duration: 1600 + Math.random() * 1400, delay: Math.random() * 400, easing: 'cubic-bezier(.3,.1,.6,1)' },
    ).onfinish = () => d.remove();
  }
}
