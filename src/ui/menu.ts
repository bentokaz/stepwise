/** Lessons page: one card per lesson with a sample question and progress. */
import { GOAL, TOPICS, topicName } from '../math/topics';
import { S, progress } from '../state';
import { $ } from './dom';
import { sfx } from './sound';

export const fmtPts = (p: number): string => (Number.isInteger(p) ? String(p) : p.toFixed(1));
const ticks = (p: number) =>
  [0, 1, 2, 3, 4].map((i) => `<i><b style="width:${Math.max(0, Math.min(1, p - i)) * 100}%"></b></i>`).join('');

export function renderMenu(): void {
  $('#mXp').textContent = String(S.xp);
  $('#mBest').textContent = String(S.best);
  $('#mDone').textContent = `${TOPICS.filter((t) => S.t[t.id].done).length}/${TOPICS.length}`;

  const last = TOPICS.find((t) => t.id === S.topic)!, ls = progress(last.id);
  $('#contSlot').innerHTML =
    ls.seen && !ls.done
      ? `<button class="cont" data-id="${last.id}"><span class="eyebrow" style="color:var(--on-dark)">Continue</span><span class="nm">${topicName(last)}</span><span class="tnum" style="font-family:var(--mono);font-size:12px">${fmtPts(ls.pts)}/${GOAL}</span><span class="go">Resume →</span></button>`
      : '';

  const groups = [...new Set(TOPICS.map((t) => t.group))];
  $('#groups').innerHTML = groups
    .map(
      (g) =>
        `<section class="group"><span class="eyebrow">${g}</span><div class="cards">${TOPICS.filter((t) => t.group === g)
          .map((t) => {
            const s = progress(t.id), e = t.gen();
            return `<button class="card${s.done ? ' mastered' : ''}" data-id="${t.id}">
              <div class="ct"><span class="nm">${t.name}${t.op ? ` <span style="font-family:var(--math);font-weight:400">(${t.op})</span>` : ''}</span><svg class="arr" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9h12M10 4l5 5-5 5"/></svg></div>
              <div class="sample"><span>${e.sample || e.q}</span></div>
              <div class="cf"><span class="ticks">${ticks(s.pts)}</span><span class="st tnum">${s.done ? 'Mastered' : s.pts ? `${fmtPts(s.pts)}/${GOAL}` : 'Start'}</span></div></button>`;
          })
          .join('')}</div></section>`,
    )
    .join('');
}

export function initMenu(go: (hash: string) => void): void {
  $('#menu').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-id]');
    if (b) {
      sfx.tap();
      go(b.dataset.id!);
    }
  });
}
