/**
 * What XP is for: levels, and rewards that unlock as your total XP grows
 * (success screens and accent colours). XP is never spent, so unlocks are permanent.
 * Rewards live on the lessons page only: during a lesson nothing here pops up,
 * and new unlocks are announced when the lesson is finished.
 */
import { S, save } from '../state';
import { $ } from './dom';
import { bigWin, type Screen } from './fx';
import { sfx } from './sound';

export interface Reward {
  id: string;
  kind: 'screen' | 'accent' | 'title';
  name: string;
  xp: number;
  desc: string;
  /** Accent swatch colours [light, dark]. */
  colors?: [string, string];
}

export const REWARDS: Reward[] = [
  { id: 'tiles', kind: 'screen', name: 'Tile flood', xp: 0, desc: 'Square tiles flood out from your answer.' },
  { id: 'shockwave', kind: 'screen', name: 'Shockwave', xp: 75, desc: 'Diamonds burst out in rings.' },
  { id: 'stripes', kind: 'screen', name: 'Stripes', xp: 200, desc: 'Slanted bars sweep across.' },
  { id: 'rain', kind: 'screen', name: 'Block rain', xp: 350, desc: 'Columns drop in and fall away.' },
  { id: 'blinds', kind: 'screen', name: 'Blinds', xp: 550, desc: 'Slats flip open from the middle.' },
  { id: 'curtain', kind: 'screen', name: 'Curtain', xp: 900, desc: 'Two halves meet, then lift away.' },
  { id: 'checker', kind: 'screen', name: 'Checkerboard', xp: 1300, desc: 'Half the squares pop, then the rest.' },
  { id: 'bars', kind: 'screen', name: 'Bars', xp: 1800, desc: 'Bars slide in from both sides.' },
  { id: 'pixels', kind: 'screen', name: 'Pixel dissolve', xp: 2500, desc: 'The screen fizzes in pixel by pixel.' },
  { id: 'wipe', kind: 'screen', name: 'Diagonal wipe', xp: 3500, desc: 'One huge slanted sweep, corner to corner.' },
  { id: 'lime', kind: 'accent', name: 'Lime', xp: 0, desc: 'The original.', colors: ['#D2F26A', '#C9EE5A'] },
  { id: 'sky', kind: 'accent', name: 'Sky', xp: 150, desc: 'A bright, clear blue.', colors: ['#8FD3FF', '#7CC8F8'] },
  { id: 'mint', kind: 'accent', name: 'Mint', xp: 275, desc: 'Fresh and calm.', colors: ['#8EF0C8', '#7AE6BA'] },
  { id: 'coral', kind: 'accent', name: 'Coral', xp: 450, desc: 'Warm and punchy.', colors: ['#FFB199', '#FF9F85'] },
  { id: 'rose', kind: 'accent', name: 'Rose', xp: 650, desc: 'Soft pink.', colors: ['#FFB3D1', '#FF9EC4'] },
  { id: 'violet', kind: 'accent', name: 'Violet', xp: 800, desc: 'For the dedicated.', colors: ['#D3B8FF', '#C4A3FF'] },
  { id: 'gold', kind: 'accent', name: 'Gold', xp: 1500, desc: 'Shiny.', colors: ['#FFD45E', '#FFCB3D'] },
  { id: 'ocean', kind: 'accent', name: 'Ocean', xp: 2100, desc: 'Deep-sea cyan.', colors: ['#6FE3EA', '#5CD9E1'] },
  { id: 'peach', kind: 'accent', name: 'Peach', xp: 2800, desc: 'Soft orange.', colors: ['#FFC98B', '#FFBE75'] },
  { id: 'ruby', kind: 'accent', name: 'Ruby', xp: 4000, desc: 'Bold red.', colors: ['#FF8A98', '#FF7A8A'] },
  { id: 'ice', kind: 'accent', name: 'Ice', xp: 5000, desc: 'Pale and cool.', colors: ['#BFE9FF', '#B0E2FF'] },
  { id: 'platinum', kind: 'accent', name: 'Platinum', xp: 7500, desc: 'For the very few.', colors: ['#E6E9EC', '#DCE1E5'] },
  { id: 't-new', kind: 'title', name: 'Newcomer', xp: 0, desc: 'Everyone starts somewhere.' },
  { id: 't-learner', kind: 'title', name: 'Learner', xp: 100, desc: 'Getting going.' },
  { id: 't-focused', kind: 'title', name: 'Locked in', xp: 300, desc: 'Staying on task.' },
  { id: 't-solver', kind: 'title', name: 'Problem solver', xp: 600, desc: 'Nothing gets past you.' },
  { id: 't-scholar', kind: 'title', name: 'Scholar', xp: 1000, desc: 'Serious study.' },
  { id: 't-ace', kind: 'title', name: 'Ace', xp: 1600, desc: 'Right first time.' },
  { id: 't-expert', kind: 'title', name: 'Expert', xp: 2400, desc: 'You know this stuff.' },
  { id: 't-master', kind: 'title', name: 'Master', xp: 3500, desc: 'Lessons fear you.' },
  { id: 't-legend', kind: 'title', name: 'Legend', xp: 5000, desc: 'People talk about you.' },
  { id: 't-grand', kind: 'title', name: 'Grandmaster', xp: 7500, desc: 'Almost the top.' },
  { id: 't-mythic', kind: 'title', name: 'Mythic', xp: 10000, desc: 'The very top.' },
];

/** Level from total XP: each level needs 25 more XP than the last (100, 125, 150, …). */
export function level(xp: number): { lvl: number; into: number; need: number } {
  let lvl = 1, need = 100, left = xp;
  while (left >= need) {
    left -= need;
    lvl++;
    need += 25;
  }
  return { lvl, into: left, need };
}

export const unlocked = (r: Reward, xp = S.xp) => xp >= r.xp;

/** The success screen to play (falls back to tiles if the saved one isn't unlocked). */
export function currentScreen(): Screen {
  const r = REWARDS.find((x) => x.kind === 'screen' && x.id === S.screen && unlocked(x));
  return (r?.id ?? 'tiles') as Screen;
}

/** The title shown with your level: the one you picked, or your best unlocked. */
export function currentTitle(): string {
  const titles = REWARDS.filter((r) => r.kind === 'title' && unlocked(r));
  return (titles.find((r) => r.id === S.title) ?? titles[titles.length - 1]).name;
}

/** Applies the equipped accent colour to the page. */
export function applyAccent(): void {
  const r = REWARDS.find((x) => x.id === S.accent && x.kind === 'accent' && unlocked(x));
  const root = document.documentElement.style;
  if (!r || r.id === 'lime') {
    for (const p of ['--lime', '--lime-soft', '--on-lime']) root.removeProperty(p);
    return;
  }
  const dark =
    document.documentElement.dataset.theme === 'dark' ||
    (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  const c = r.colors![dark ? 1 : 0];
  root.setProperty('--lime', c);
  root.setProperty('--lime-soft', `color-mix(in srgb, ${c} ${dark ? 18 : 35}%, var(--surface))`);
  root.setProperty('--on-lime', '#131a1a');
}

/** Records rewards newly unlocked by going from `before` to `after` XP; they're announced after the lesson. */
export function checkUnlocks(before: number, after: number): Reward[] {
  const fresh = REWARDS.filter((r) => r.xp > before && r.xp <= after);
  if (fresh.length) {
    S.newRewards = [...new Set([...(S.newRewards ?? []), ...fresh.map((r) => r.id)])];
    save();
  }
  return fresh;
}

/** Unlocks not yet seen in the Rewards dialog. */
export const newRewards = (): Reward[] => (S.newRewards ?? []).map((id) => REWARDS.find((r) => r.id === id)!).filter(Boolean);

/** Lessons page: a corner note about unseen unlocks. */
export function toastNew(): void {
  const rs = newRewards();
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  if (!rs.length) return;
  const t = document.createElement('button');
  t.className = 'toast';
  t.innerHTML = `<span class="eyebrow">New reward${rs.length > 1 ? 's' : ''} unlocked</span><b>${rs.map((r) => r.name).join(', ')}</b><span class="sub">Tap to open Rewards.</span>`;
  t.onclick = () => {
    t.remove();
    openRewards();
  };
  document.body.appendChild(t);
  t.animate([{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 300, fill: 'both' });
  setTimeout(() => t.remove(), 9000);
}

/** Header chip: "Lv 3". */
export function levelLabel(): string {
  return `Lv ${level(S.xp).lvl}`;
}

let onChange: () => void = () => {};
export function initRewards(changed: () => void): void {
  onChange = changed;
  applyAccent();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAccent);
  document.addEventListener('click', (e) => {
    if ((e.target as Element).closest('[data-rewards]')) {
      sfx.tap();
      openRewards();
    }
  });
  $('#rwd').addEventListener('click', (e) => {
    const el = e.target as Element;
    if (el === $('#rwd') || el.closest('[data-close]')) return closeRewards();
    const b = el.closest<HTMLElement>('[data-rid]');
    if (!b) return;
    const r = REWARDS.find((x) => x.id === b.dataset.rid)!;
    if (!unlocked(r)) return;
    if (el.closest('[data-preview]')) {
      sfx.win();
      bigWin(el.closest('.rcard')!, 10, 2, true, r.id as Screen);
      return;
    }
    if (!el.closest('[data-use]')) return;
    if (r.kind === 'screen') S.screen = r.id;
    else if (r.kind === 'title') S.title = r.id;
    else S.accent = r.id;
    save();
    applyAccent();
    sfx.tap();
    renderRewards();
    onChange();
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#rwd').hidden) closeRewards();
  });
}

function closeRewards() {
  $('#rwd').hidden = true;
  onChange();
}

export function openRewards(): void {
  renderRewards();
  // opening the dialog counts as seeing the new unlocks
  const fresh = new Set(S.newRewards ?? []);
  S.newRewards = [];
  save();
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  $('#rwd').hidden = false;
  $<HTMLElement>('#rwd [data-close]').focus();
  $('#rwdBody')
    .querySelectorAll<HTMLElement>('[data-rid]')
    .forEach((c) => c.classList.toggle('fresh', fresh.has(c.dataset.rid!)));
}

function renderRewards() {
  const { lvl, into, need } = level(S.xp);
  const next = REWARDS.filter((r) => !unlocked(r)).sort((a, b) => a.xp - b.xp)[0];
  const card = (r: Reward) => {
    const open = unlocked(r);
    const on = r.kind === 'screen' ? currentScreen() === r.id : r.kind === 'title' ? currentTitle() === r.name : (S.accent ?? 'lime') === r.id;
    const sw =
      r.kind === 'accent' ? `<i class="rsw" style="background:${r.colors![0]}"></i>` : r.kind === 'title' ? `<i class="rtt">Aa</i>` : `<i class="rsc rsc-${r.id}"></i>`;
    return `<div class="rcard${open ? '' : ' locked'}${on ? ' on' : ''}" data-rid="${r.id}">
      ${sw}<div class="rtx"><b>${r.name}</b><span>${open ? r.desc : `Unlocks at ${r.xp} XP (${r.xp - S.xp} to go)`}</span></div>
      <div class="rbt">${
        open
          ? `${r.kind === 'screen' ? `<button class="btn ghost sm" data-preview>Preview</button>` : ''}<button class="btn ${on ? 'primary' : 'ghost'} sm" data-use ${on ? 'disabled' : ''}>${on ? 'Using' : 'Use'}</button>`
          : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>`
      }</div></div>`;
  };
  $('#rwdBody').innerHTML = `
    <div class="rlvl"><div><span class="eyebrow">Level</span><b class="tnum">${lvl}</b><span class="rtitle">${currentTitle()}</span></div>
      <div class="rbar"><i style="width:${(into / need) * 100}%"></i></div>
      <span class="tnum">${into}/${need} XP to level ${lvl + 1}</span></div>
    <p class="rnote">You have <b class="tnum">${S.xp} XP</b>. XP is never spent: rewards unlock as your total grows.${
      next ? ` Next unlock: <b>${next.name}</b> at ${next.xp} XP.` : ' Everything is unlocked.'
    }</p>
    <span class="eyebrow">Success screen</span><div class="rgrid">${REWARDS.filter((r) => r.kind === 'screen').map(card).join('')}</div>
    <span class="eyebrow">Accent colour</span><div class="rgrid">${REWARDS.filter((r) => r.kind === 'accent').map(card).join('')}</div>
    <span class="eyebrow">Title (shown with your level)</span><div class="rgrid">${REWARDS.filter((r) => r.kind === 'title').map(card).join('')}</div>`;
}
