/** Step-by-step working: equations line up on "=", each step has a plain explanation and the operation shown under both sides. */
import { MINUS } from '../math/html';
import { ansHTML, type Problem, type Step } from '../math/topics';
import { reduceMotion } from './dom';
import { sfx } from './sound';

export type WalkMode = 'reveal' | 'solution' | 'example';

export interface WalkOptions {
  mode: WalkMode;
  /** Show every step at once. */
  all?: boolean;
  /** Advance one step at a time on a timer until the student takes over. */
  auto?: boolean;
  /** What the student typed, shown crossed out in reveal mode. */
  wrong?: string;
}

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function walkthrough(pr: Problem, { mode, all, auto, wrong = '' }: WalkOptions): HTMLElement {
  const el = document.createElement('div');
  el.className = 'wt';
  const total = pr.work.length - 1;
  let shown = all ? total : mode === 'example' ? 0 : 1;
  let timer: number | undefined;

  const answer = `<span class="ansch">${pr.lhs || ''}${ansHTML(pr)}</span>`;
  const head =
    mode === 'reveal'
      ? `<span class="eyebrow">Answer</span>${answer}<span class="yours">You put <s>${escape(wrong).replace(/-/g, MINUS)}</s></span>`
      : mode === 'solution'
        ? `<span class="eyebrow">Working</span>${answer}`
        : `<span class="eyebrow">Working</span>`;
  el.innerHTML = `<div class="wt-h">${head}<div class="wt-c"><span class="cnt tnum"></span><button class="btn ghost sm" data-a="all">Show all</button><button class="btn primary sm" data-a="next">Next step</button></div></div><div class="wt-b"><div class="wg"></div></div>`;

  const grid = el.querySelector<HTMLElement>('.wg')!;
  const body = el.querySelector<HTMLElement>('.wt-b')!;
  const nextBtn = el.querySelector<HTMLButtonElement>('[data-a="next"]')!;
  const allBtn = el.querySelector<HTMLButtonElement>('[data-a="all"]')!;
  const counter = el.querySelector<HTMLElement>('.cnt')!;

  const eqRow = (st: Step, cls: string) =>
    `<div class="l ${cls}">${st.l}</div><div class="e ${cls}">${st.r !== '' ? '=' : ''}</div><div class="r ${cls}">${st.r}</div>`;

  function render(newFrom: number) {
    let h = '';
    pr.work.forEach((st, i) => {
      if (i > shown) return;
      const nw = i >= newFrom ? 'nw' : '';
      const fin = i === total && shown === total ? ' fin' : '';
      if (i > 0) {
        h += `<div class="why ${nw}${i === shown ? ' cur' : ''}"><b>${i}</b><span>${st.why ?? ''}</span></div>`;
        if (st.op) h += `<div class="l op ${nw}"><span>${st.op}</span></div><div class="op ${nw}"></div><div class="r op ${nw}"><span>${st.op}</span></div>`;
      }
      h += eqRow(st, nw + fin);
    });
    grid.innerHTML = h;
    counter.textContent = shown ? `Step ${shown} of ${total}` : `${total} steps`;
    const done = shown >= total;
    nextBtn.disabled = done;
    allBtn.hidden = done;
    if (newFrom <= shown) body.scrollTo({ top: body.scrollHeight, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  function next() {
    if (shown < total) {
      shown++;
      render(shown);
      sfx.step();
    } else clearInterval(timer);
  }

  el.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLElement>('[data-a]')?.dataset.a;
    if (!a) return;
    clearInterval(timer);
    if (a === 'next') next();
    else {
      const from = shown + 1;
      shown = total;
      render(from);
    }
  });

  render(all ? Infinity : 0);
  if (auto && !reduceMotion()) {
    timer = window.setInterval(() => {
      if (!el.isConnected || shown >= total) return clearInterval(timer);
      next();
    }, 1400);
  }
  return el;
}
