import { describe, expect, it } from 'vitest';
import { F, feq } from '../src/math/core';
import { parseAnswer } from '../src/math/parse';

describe('parseAnswer', () => {
  it.each([
    ['7', F(7)],
    ['-3', F(-3)],
    ['−3', F(-3)],
    [' 4 ', F(4)],
    ['0.25', F(1, 4)],
    ['.5', F(1, 2)],
    ['-1.5', F(-3, 2)],
    ['5/8', F(5, 8)],
    ['-13/12', F(-13, 12)],
  ])('reads %s', (raw, want) => {
    const p = parseAnswer(raw);
    expect(p.ok).toBe(true);
    if (p.ok) expect(feq(p.f, want)).toBe(true);
  });

  it('flags fractions that are not fully simplified', () => {
    for (const raw of ['4/2', '6/1', '3/-4', '2/4']) {
      const p = parseAnswer(raw);
      expect(p.ok && p.simplified).toBe(false);
    }
    const ok = parseAnswer('3/4');
    expect(ok.ok && ok.simplified).toBe(true);
  });

  it('rejects a zero denominator and junk', () => {
    expect(parseAnswer('3/0')).toEqual({ ok: false, reason: 'zero' });
    for (const raw of ['', 'x', '1/2/3', '--4', '3-']) expect(parseAnswer(raw)).toEqual({ ok: false, reason: 'format' });
  });
});
