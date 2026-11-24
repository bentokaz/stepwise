/**
 * Turns a typed expression like "2x + 1", "-x^2", "sqrt(x)" or "y = 3(x - 1)" into a function of x.
 * Only numbers, x, pi, e, + − × ÷ ^ ( ) and a few named functions are allowed; anything else throws.
 */
const FN: Record<string, string> = {
  sin: 'Math.sin',
  cos: 'Math.cos',
  tan: 'Math.tan',
  sqrt: 'Math.sqrt',
  abs: 'Math.abs',
  log: 'Math.log10',
  ln: 'Math.log',
};

type Kind = 'num' | 'val' | 'fn' | 'op' | 'lp' | 'rp';
const ENDS_VALUE: Kind[] = ['num', 'val', 'rp'];
const STARTS_VALUE: Kind[] = ['num', 'val', 'fn', 'lp'];

export type Fn = (x: number) => number;

/** Returns null for an empty expression; throws on one it can't read. */
export function compile(src: string): Fn | null {
  const s = src
    .replace(/^\s*y\s*=/i, '')
    .replace(/[−–]/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .toLowerCase()
    .trim();
  if (!s) return null;
  const toks = s.match(/\d*\.?\d+|[a-z]+|[-+*/^()]|\S/g) ?? [];
  let out = '';
  let prev: Kind | null = null;
  let depth = 0;
  const emit = (code: string, kind: Kind) => {
    if (prev && ENDS_VALUE.includes(prev) && STARTS_VALUE.includes(kind)) out += '*'; // implicit multiplication
    out += code;
    prev = kind;
  };
  for (const t of toks) {
    if (/^\d*\.?\d+$/.test(t)) emit(t, 'num');
    else if (t === 'pi') emit('Math.PI', 'val');
    else if (FN[t]) emit(FN[t], 'fn');
    else if (/^[a-z]+$/.test(t)) {
      // "x", "xx", "ex" … any run of x and e
      if (![...t].every((c) => c === 'x' || c === 'e')) throw new Error(`Unknown name "${t}"`);
      for (const c of t) emit(c === 'x' ? 'x' : 'Math.E', 'val');
    } else if (t === '(') {
      depth++;
      emit('(', 'lp');
    } else if (t === ')') {
      if (--depth < 0) throw new Error('Unmatched )');
      out += ')';
      prev = 'rp';
    } else if ('+-*/^'.includes(t)) {
      const before = prev as Kind | null; // `emit` reassigns prev, which TS's narrowing can't see
      if (t === '-' && (!before || before === 'op' || before === 'lp')) {
        out += '(-1)*'; // unary minus, so -x^2 means -(x^2)
      } else out += t === '^' ? '**' : t;
      prev = 'op';
    } else throw new Error(`Unexpected "${t}"`);
  }
  if (depth !== 0) throw new Error('Unmatched (');
  const f = new Function('x', `return ${out};`) as Fn;
  f(1); // surfaces syntax problems like "2+" now rather than while drawing
  return f;
}
