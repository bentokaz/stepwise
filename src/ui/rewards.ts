/**
 * What XP is for: levels, and rewards that unlock as your total XP grows
 * (success scenes and accent colours). XP is never spent, so unlocks are permanent.
 */
import { S, save } from '../state';
import { $ } from './dom';
import { playScene, type SceneId } from './scene';
import { sfx } from './sound';

export interface Reward {
  id: string;
  kind: 'scene' | 'accent';
  name: string;
  xp: number;
  desc: string;
  /** Accent swatch colours [light, dark]. */
  colors?: [string, string];
}

export const REWARDS: Reward[] = [
  { id: 'tiles', kind: 'scene', name: 'Tile flood', xp: 0, desc: 'Tiles burst across the screen.' },
  { id: 'forest', kind: 'scene', name: 'Forest stream', xp: 50, desc: 'A short walk beside a stream, with birdsong.' },
  { id: 'dusk', kind: 'scene', name: 'Fireflies at dusk', xp: 250, desc: 'The same walk at sunset, with fireflies and crickets.' },
  { id: 'snow', kind: 'scene', name: 'Snowy pines', xp: 600, desc: 'A quiet walk through falling snow.' },
  { id: 'lime', kind: 'accent', name: 'Lime', xp: 0, desc: 'The original.', colors: ['#D2F26A', '#C9EE5A'] },
  { id: 'sky', kind: 'accent', name: 'Sky', xp: 150, desc: 'A bright, clear blue.', colors: ['#8FD3FF', '#7CC8F8'] },
  { id: 'coral', kind: 'accent', name: 'Coral', xp: 400, desc: 'Warm and punchy.', colors: ['#FFB199', '#FF9F85'] },
  { id: 'violet', kind: 'accent', name: 'Violet', xp: 800, desc: 'For the dedicated.', colors: ['#D3B8FF', '#C4A3FF'] },
  { id: 'gold', kind: 'accent', name: 'Gold', xp: 1500, desc: 'Top tier.', colors: ['#FFD45E', '#FFCB3D'] },
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

/** Rewards newly unlocked by going from `before` to `after` XP. Equips the first scene unlock automatically. */
export function checkUnlocks(before: number, after: number): Reward[] {
  const fresh = REWARDS.filter((r) => r.xp > before && r.xp <= after);
  if (fresh.some((r) => r.id === 'forest') && S.scene === 'tiles') {
    S.scene = 'forest';
    save();
  }
  return fresh;
}

/** A small toast in the corner announcing an unlock. */
export function toastUnlock(rs: Reward[]): void {
  for (const r of rs) {
    const t = document.createElement('button');
    t.className = 'toast';
    t.innerHTML = `<span class="eyebrow">Unlocked at ${r.xp} XP</span><b>${r.kind === 'scene' ? 'Success scene' : 'Colour'}: ${r.name}</b><span class="sub">${
      r.id === 'forest' && S.scene === 'forest' ? 'Turned on. Change it in Rewards.' : 'Tap to open Rewards.'
    }</span>`;
    t.onclick = () => {
      t.remove();
      openRewards();
    };
    document.body.appendChild(t);
    t.animate(
      [
        { transform: 'translateY(20px)', opacity: 0 },
        { transform: 'none', opacity: 1, offset: 0.08 },
        { transform: 'none', opacity: 1, offset: 0.9 },
        { transform: 'translateY(10px)', opacity: 0 },
      ],
      { duration: 6000, delay: 1800, fill: 'both' },
    ).onfinish = () => t.remove();
  }
}

/** Header chip: "Lv 3". */
export function levelLabel(): string {
  return `Lv ${level(S.xp).lvl}`;
}

let onChange: () => void = () => {};
export function initRewards(changed: () => void): void {
  onChange = changed;
  applyAccent();
  // orbs found in the forest add XP
  addEventListener('stepwise:xp', (e) => {
    const n = (e as CustomEvent<number>).detail;
    const fresh = checkUnlocks(S.xp - n, S.xp);
    if (fresh.length) toastUnlock(fresh);
    onChange();
  });
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
      closeRewards();
      if (r.id !== 'tiles') setTimeout(() => playScene(r.id as SceneId, 'Preview', r.name), 150);
      return;
    }
    if (r.kind === 'scene') S.scene = r.id;
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
}

export function openRewards(): void {
  renderRewards();
  $('#rwd').hidden = false;
  $<HTMLElement>('#rwd [data-close]').focus();
}

function renderRewards() {
  const { lvl, into, need } = level(S.xp);
  const next = REWARDS.filter((r) => !unlocked(r)).sort((a, b) => a.xp - b.xp)[0];
  const card = (r: Reward) => {
    const open = unlocked(r);
    const on = (r.kind === 'scene' ? S.scene : S.accent) === r.id;
    const sw =
      r.kind === 'accent'
        ? `<i class="rsw" style="background:${r.colors![0]}"></i>`
        : `<i class="rsc rsc-${r.id}"></i>`;
    return `<div class="rcard${open ? '' : ' locked'}${on ? ' on' : ''}" data-rid="${r.id}">
      ${sw}<div class="rtx"><b>${r.name}</b><span>${open ? r.desc : `Unlocks at ${r.xp} XP (${r.xp - S.xp} to go)`}</span></div>
      <div class="rbt">${
        open
          ? `${r.kind === 'scene' && r.id !== 'tiles' ? `<button class="btn ghost sm" data-preview>Preview</button>` : ''}<button class="btn ${on ? 'primary' : 'ghost'} sm" ${on ? 'disabled' : ''}>${on ? 'Using' : 'Use'}</button>`
          : `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="10" height="7"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>`
      }</div></div>`;
  };
  $('#rwdBody').innerHTML = `
    <div class="rlvl"><div><span class="eyebrow">Level</span><b class="tnum">${lvl}</b></div>
      <div class="rbar"><i style="width:${(into / need) * 100}%"></i></div>
      <span class="tnum">${into}/${need} XP to level ${lvl + 1}</span></div>
    <p class="rnote">You have <b class="tnum">${S.xp} XP</b>. XP is never spent: rewards unlock as your total grows.${
      next ? ` Next unlock: <b>${next.name}</b> at ${next.xp} XP.` : ' Everything is unlocked.'
    }</p>
    <span class="eyebrow">Success scene</span><div class="rgrid">${REWARDS.filter((r) => r.kind === 'scene').map(card).join('')}</div>
    <span class="eyebrow">Accent colour</span><div class="rgrid">${REWARDS.filter((r) => r.kind === 'accent').map(card).join('')}</div>`;
}
