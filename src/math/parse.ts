/** Reads what the student typed in the answer box. */
import { F, gcd, type Frac } from './core';

export type Parsed =
  | { ok: true; f: Frac; simplified: boolean; kind: 'int' | 'dec' | 'frac'; num?: number; den?: number }
  | { ok: false; reason: 'format' | 'zero' };

/** Normalises typed minus signs and strips spaces. */
export const clean = (s: string): string => s.replace(/\s+/g, '').replace(/[−–]/g, '-');

export function parseAnswer(raw: string): Parsed {
  const s = clean(raw);
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(-?\d+)\/(-?\d+)$/))) {
    const n = +m[1], d = +m[2];
    if (d === 0) return { ok: false, reason: 'zero' };
    return { ok: true, f: F(n, d), simplified: gcd(n, d) === 1 && d > 0 && d !== 1, kind: 'frac', num: n, den: d };
  }
  if (/^-?\d+$/.test(s)) return { ok: true, f: F(+s), simplified: true, kind: 'int' };
  if ((m = s.match(/^(-?)(\d*)\.(\d+)$/))) {
    const k = m[3].length;
    return { ok: true, f: F(parseInt((m[2] || '0') + m[3], 10) * (m[1] ? -1 : 1), 10 ** k), simplified: true, kind: 'dec' };
  }
  return { ok: false, reason: 'format' };
}
