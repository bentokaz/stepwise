import { describe, expect, it } from 'vitest';
import { compile } from '../src/math/expr';

const at = (src: string, x: number) => compile(src)!(x);

describe('compile', () => {
  it.each([
    ['2x + 1', 3, 7],
    ['y = 2x + 1', 3, 7],
    ['x^2 − 3', 2, 1],
    ['-x^2', 2, -4],
    ['2(x + 1)', 1, 4],
    ['(x+1)(x-1)', 3, 8],
    ['xx', 3, 9],
    ['3x÷2', 4, 6],
    ['2×x', 4, 8],
    ['sqrt(x)', 9, 3],
    ['abs(x)', -5, 5],
    ['2sin(x)', 0, 0],
    ['-0.5x + 4', 2, 3],
  ])('%s at x=%d is %d', (src, x, want) => {
    expect(at(src, x)).toBeCloseTo(want);
  });

  it('knows pi and e', () => {
    expect(at('sin(pi/2)', 0)).toBeCloseTo(1);
    expect(at('ln(e)', 0)).toBeCloseTo(1);
  });

  it('returns null for an empty box', () => {
    expect(compile('   ')).toBeNull();
    expect(compile('y =')).toBeNull();
  });

  it('refuses anything that is not maths', () => {
    for (const src of ['alert(1)', 'x; 1', 'window', '2+', '(x', 'x)', '[1]', 'x.constructor']) {
      expect(() => compile(src), src).toThrow();
    }
  });
});
