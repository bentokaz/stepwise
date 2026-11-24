import { describe, expect, it } from 'vitest';
import { ansHTML, TOPICS } from '../src/math/topics';

const RUNS = 2000;

describe.each(TOPICS.map((t) => [t.id, t] as const))('lesson %s', (_id, topic) => {
  it('always gives a whole-number answer from −9 to 9', () => {
    for (let i = 0; i < RUNS; i++) {
      const p = topic.gen();
      expect(p.ans.d).toBe(1);
      expect(Math.abs(p.ans.n)).toBeLessThanOrEqual(9);
    }
  });

  it('ends its working on the answer', () => {
    for (let i = 0; i < RUNS; i++) {
      const p = topic.gen();
      expect(p.work.length).toBeGreaterThanOrEqual(2);
      expect(p.work[p.work.length - 1].r).toBe(ansHTML(p));
      for (const st of p.work.slice(1)) expect(st.why).toBeTruthy();
    }
  });

  it('never prints a raw "-" or NaN in the question', () => {
    for (let i = 0; i < 300; i++) {
      const p = topic.gen();
      const text = p.q.replace(/<[^>]+>/g, ' ');
      expect(text).not.toMatch(/NaN|undefined|Infinity/);
      if (!p.q.startsWith('<svg')) expect(text).not.toMatch(/(^|[^\w])-\d/);
    }
  });
});

it('lesson ids are unique', () => {
  expect(new Set(TOPICS.map((t) => t.id)).size).toBe(TOPICS.length);
});
