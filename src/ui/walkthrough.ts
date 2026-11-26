/** Step-by-step working: equations line up on "=", each step has a plain explanation and the operation shown under both sides. */
import { ansHTML, type Problem } from '../math/topics';
import { stepsHTML } from '../math/workhtml';
import { reduceMotion } from './dom';
import { sfx } from './sound';

export type WalkMode = 'reveal' | 'solution' | 'example';

export interface WalkOptions {
  mode: WalkMode;
  /** Show every step at once. */
  all?: boolean;
  /** Advance one step at a time on a timer until the student takes over. */
  auto?: boolean;
  /** What the student answered, as safe HTML, shown crossed out in reveal mode. */
  wrongHTML?: string;
}

export function walkthrough(pr: Problem, { mode, all, auto, wrongHTML = '' }: WalkOptions): HTMLElement {
  const el = document.createElement('div');
  el.className = 'wt';
  const total = pr.work.length - 1;
  let shown = all ? total : mode === 'example' ? 0 : 1;
  let timer: number | undefined;

  const ans = ansHTML(pr);
  // word answers (multiple choice) can be a whole sentence: show them smaller, in the UI font
  const long = ans.replace(/<[^>]+>/g, '').length > 28;
  if (long) el.classList.add('long');
  const answer = `<span class="ansch${long ? ' long' : ''}">${pr.lhs || ''}${ans}</span>`;
  const head =
    mode === 'reveal'
      ? `<span class="eyebrow">Answer</span>${answer}<span class="yours">You put <s>${wrongHTML}</s></span>`
      : mode === 'solution'
        ? `<span class="eyebrow">Working</span>${answer}`
        : `<span class="eyebrow">Working</span>`;
  el.innerHTML = `<div class="wt-h">${head}<div class="wt-c"><span class="cnt tnum"></span><button class="btn ghost sm" data-a="all">Show all</button><button class="btn primary sm" data-a="next">Next step</button></div></div><div class="wt-b"><div class="wg"></div></div>`;

  const grid = el.querySelector<HTMLElement>('.wg')!;
  const body = el.querySelector<HTMLElement>('.wt-b')!;
  const nextBtn = el.querySelector<HTMLButtonElement>('[data-a="next"]')!;
  const allBtn = el.querySelector<HTMLButtonElement>('[data-a="all"]')!;
  const counter = el.querySelector<HTMLElement>('.cnt')!;

  function render(newFrom: number) {
    const h = stepsHTML(pr.work, { shown, newFrom, finished: shown === total });
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
