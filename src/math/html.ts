/** Tiny helpers that turn numbers and expressions into typeset HTML. */
import { type Frac } from './core';

export const MINUS = '−';

/** Signed integer with a real minus sign. */
export const N = (n: number): string => (n < 0 ? MINUS + -n : '' + n);
/** Italic variable. */
export const V = (x: string): string => `<i class="mv">${x}</i>`;
/** Stacked fraction. */
export const FR = (a: string | number, b: string | number): string =>
  `<span class="fr"><span class="fn">${a}</span><span class="fd">${b}</span></span>`;
/** Spaced operator. */
export const o = (s: string): string => `<span class="mo">${s}</span>`;
export const EQ = o('=');
/** Coefficient in front of a variable: 1 → '', −1 → '−'. */
export const coef = (a: number): string => (a === 1 ? '' : a === -1 ? MINUS : N(a));
/** A fraction as HTML, with the sign out front. */
export const fH = (f: Frac): string => (f.d === 1 ? N(f.n) : (f.n < 0 ? MINUS : '') + FR(Math.abs(f.n), f.d));
/** "+ 5" or "− 5" for the term after a variable. */
export const signed = (b: number): string => (b < 0 ? o(MINUS) + -b : o('+') + b);
/** Negative numbers get parentheses. */
export const paren = (n: number): string => (n < 0 ? `(${N(n)})` : '' + n);
export const dec = (x: number): string => N(parseFloat(x.toFixed(6)));
export const fDec = (f: Frac): string => dec(f.n / f.d);

/** A line through two lattice points on a −6…6 grid, for slope questions. */
export function graphSVG(x1: number, y1: number, x2: number, y2: number, small = false): string {
  const m = (y2 - y1) / (x2 - x1);
  const yAt = (x: number) => y1 + m * (x - x1);
  let g = '';
  for (let i = -6; i <= 6; i++) {
    g += `<line class="gl" x1="${i}" y1="-6.5" x2="${i}" y2="6.5"/><line class="gl" x1="-6.5" y1="${i}" x2="6.5" y2="${i}"/>`;
  }
  g += `<line class="ax" x1="-6.5" y1="0" x2="6.5" y2="0"/><line class="ax" x1="0" y1="-6.5" x2="0" y2="6.5"/>`;
  let lb = '';
  if (!small) {
    for (let i = -6; i <= 6; i += 2) {
      if (!i) continue;
      lb += `<text class="lb" x="${i}" y=".75" text-anchor="middle">${N(i)}</text><text class="lb" x="-.25" y="${-i + 0.18}" text-anchor="end">${N(i)}</text>`;
    }
  }
  const pts = [
    [x1, y1],
    [x2, y2],
  ]
    .map(
      ([x, y]) =>
        `<circle class="pt" cx="${x}" cy="${-y}" r="${small ? 0.32 : 0.2}"/>` +
        (small ? '' : `<text class="pl" x="${x + 0.3}" y="${-y - 0.3}">(${N(x)}, ${N(y)})</text>`),
    )
    .join('');
  return `<svg class="gsv" viewBox="-6.8 -6.8 13.6 13.6" role="img" aria-label="Graph of a line through (${N(x1)}, ${N(y1)}) and (${N(x2)}, ${N(y2)})"><rect class="bgr" x="-6.8" y="-6.8" width="13.6" height="13.6"/>
  <g transform="scale(1,-1)">${g}</g>${lb}<line class="ln" x1="-6.6" y1="${-yAt(-6.6)}" x2="6.6" y2="${-yAt(6.6)}"/>${pts}</svg>`;
}
