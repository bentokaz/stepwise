import { describe, expect, it } from 'vitest';
import { feq, F } from '../src/math/core';
import { ansHTML, TOPICS } from '../src/math/topics';

const RUNS = 2000;
const whole = (f: { n: number; d: number }) => f.d === 1 && Math.abs(f.n) <= 9;

describe.each(TOPICS.map((t) => [t.id, t] as const))('lesson %s', (_id, topic) => {
  it('gives whole-number answers from −9 to 9 (or a valid option)', () => {
    for (let i = 0; i < RUNS; i++) {
      const p = topic.gen();
      if (p.kind === 'pair') {
        expect(p.pair!.every(whole)).toBe(true);
      } else if (p.kind === 'choice') {
        expect(p.choices!.length).toBeGreaterThanOrEqual(2);
        expect(new Set(p.choices).size).toBe(p.choices!.length);
        expect(p.correct).toBeGreaterThanOrEqual(0);
        expect(p.correct).toBeLessThan(p.choices!.length);
      } else {
        expect(whole(p.ans)).toBe(true);
      }
    }
  });

  it('ends its working on the answer, with an explanation for every step', () => {
    for (let i = 0; i < RUNS; i++) {
      const p = topic.gen();
      expect(p.work.length).toBeGreaterThanOrEqual(2);
      for (const st of p.work.slice(1)) expect(st.why).toBeTruthy();
      if (p.kind === 'choice' && p.work.every((st) => st.full !== ansHTML(p))) continue; // explain-the-step: the answer is an explanation
      const last = p.work[p.work.length - 1];
      expect(last.full ?? last.r).toBe(ansHTML(p));
    }
  });

  it('never prints NaN or a raw "-" sign in the question', () => {
    for (let i = 0; i < 300; i++) {
      const p = topic.gen();
      const text = p.q.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
      expect(text).not.toMatch(/NaN|undefined|Infinity/);
      expect(text).not.toMatch(/(^|[^\w])-\d/);
    }
  });
});

it('lesson ids are unique', () => {
  expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
});

/** Pulls the integers out of "ax + by = c" rows so the solution can be checked against both equations. */
describe('simultaneous equations really solve', () => {
  const nums = (html: string) =>
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/−/g, '-')
      .replace(/&nbsp;/g, ' ');
  const coefOf = (side: string, v: 'x' | 'y') => {
    const m = side.replace(/\s+/g, '').match(new RegExp(`([+-]?\\d*)${v}`));
    if (!m) return 0;
    return m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  };
  for (const id of ['sim-sub', 'sim-elim', 'sim-graph']) {
    it(`${id}: the pair satisfies both starting equations`, () => {
      const topic = TOPICS.find((t) => t.id === id)!;
      for (let i = 0; i < 1000; i++) {
        const p = topic.gen();
        if (p.kind !== 'pair') continue;
        const [x, y] = p.pair!.map((f) => f.n);
        for (const row of p.work[0].rows!) {
          const L = nums(row.l), Rt = nums(row.r);
          // move everything to "lhs − rhs = 0" and evaluate
          const val = (side: string) => {
            const s = side.replace(/\s+/g, '');
            const cx = coefOf(s, 'x'), cy = coefOf(s, 'y');
            const k = s.replace(/[+-]?\d*[xy]/g, '');
            return cx * x + cy * y + (k ? Number(k) : 0);
          };
          expect(val(L), `${row.l} = ${row.r} at (${x}, ${y})`).toBe(val(Rt));
        }
      }
    });
  }

  it('the multiplier is a real change (never 0 or 1)', () => {
    const topic = TOPICS.find((t) => t.id === 'sim-mult')!;
    for (let i = 0; i < 500; i++) {
      const p = topic.gen();
      expect(feq(p.ans, F(0))).toBe(false);
      expect(feq(p.ans, F(1))).toBe(false);
    }
  });
});
