/**
 * Lessons and their procedural question generators.
 * Every generator picks numbers so the answer is a whole number from −9 to 9.
 */
import { F, NZ, R, gcd, lcm, pick, type Frac } from './core';
import { EQ, FR, MINUS as M, N, V, coef, dec, fDec, fH, graphSVG, o, paren, signed } from './html';

/** One line of working. The first line is the starting equation; later lines explain the move in `why`. */
export interface Step {
  l: string;
  r: string;
  why?: string;
  /** Operation applied to both sides, shown under each side. */
  op?: string;
}

export interface Problem {
  /** Instruction above the question (HTML). */
  inst: string;
  /** The question itself (HTML or SVG). */
  q: string;
  /** Smaller picture for the lesson card, when `q` is too big. */
  sample?: string;
  /** Label before the answer box, such as "x =". Empty for "evaluate" questions. */
  lhs: string;
  ans: Frac;
  /** Show the answer as a decimal instead of a fraction. */
  fmt?: 'dec';
  work: Step[];
}

export interface Topic {
  id: string;
  group: string;
  name: string;
  /** Symbol shown after the name, such as × or ÷. */
  op: string;
  gen(): Problem;
}

const VARS = ['x', 'a', 'n', 'm', 'y', 'k', 'p', 't', 'b', 'w'] as const;
const W = (l: string, r: string): Step => ({ l, r });
const St = (why: string, l: string, r: string, op?: string): Step => ({ why, l, r, op });

export const GOAL = 5;

export const TOPICS: Topic[] = [
  {
    id: 'mul',
    group: 'Equations',
    name: 'One-step equations',
    op: '×',
    gen() {
      const v = pick(VARS), a = NZ(-12, 12, [0, 1, -1]), x = NZ(-9, 9), b = a * x, ans = F(b, a);
      const work = [
        W(`${coef(a)}${V(v)}`, N(b)),
        St(`Divide both sides by ${N(a)} so ${V(v)} is by itself.`, V(v), FR(N(b), N(a)), `÷ ${paren(a)}`),
        St(`Divide.`, V(v), fH(ans)),
      ];
      return { inst: `Solve for ${V(v)}.`, q: `${coef(a)}${V(v)}${EQ}${N(b)}`, lhs: `${V(v)}${EQ}`, ans, work };
    },
  },
  {
    id: 'div',
    group: 'Equations',
    name: 'One-step equations',
    op: '÷',
    gen() {
      const v = pick(VARS);
      let a: number, b: number;
      do {
        a = NZ(-5, 5, [0, 1, -1]);
        b = NZ(-5, 5);
      } while (Math.abs(a * b) > 9);
      return {
        inst: `Solve for ${V(v)}.`,
        q: `${FR(V(v), N(a))}${EQ}${N(b)}`,
        lhs: `${V(v)}${EQ}`,
        ans: F(a * b),
        work: [
          W(FR(V(v), N(a)), N(b)),
          St(`Multiply both sides by ${N(a)} to undo the division.`, V(v), `${paren(b)}${o('·')}${paren(a)}`, `× ${paren(a)}`),
          St(
            `Multiply. ${a < 0 !== b < 0 ? 'The signs are different, so the result is negative.' : 'The signs match, so the result is positive.'}`,
            V(v),
            N(a * b),
          ),
        ],
      };
    },
  },
  {
    id: 'two',
    group: 'Equations',
    name: 'Two-step equations',
    op: '',
    gen() {
      const v = pick(VARS), x = NZ(-9, 9), a = NZ(-9, 9, [0, 1, -1]), b = NZ(-20, 20), c = a * x + b;
      return {
        inst: `Solve for ${V(v)}.`,
        q: `${coef(a)}${V(v)}${signed(b)}${EQ}${N(c)}`,
        lhs: `${V(v)}${EQ}`,
        ans: F(x),
        work: [
          W(`${coef(a)}${V(v)}${signed(b)}`, N(c)),
          St(
            `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides to undo the ${b > 0 ? '+' : M}${Math.abs(b)}.`,
            `${coef(a)}${V(v)}`,
            N(c - b),
            `${b > 0 ? M : '+'} ${Math.abs(b)}`,
          ),
          St(`Divide both sides by ${N(a)}.`, V(v), N(x), `÷ ${paren(a)}`),
        ],
      };
    },
  },
  {
    id: 'dist',
    group: 'Equations',
    name: 'Distributive property',
    op: '',
    gen() {
      const v = pick(VARS), a = NZ(-8, 8, [0, 1, -1]), b = NZ(-9, 9), x = NZ(-9, 9), c = a * (x + b), ab = a * b;
      return {
        inst: `Solve for ${V(v)}.`,
        q: `${N(a)}(${V(v)}${signed(b)})${EQ}${N(c)}`,
        lhs: `${V(v)}${EQ}`,
        ans: F(x),
        work: [
          W(`${N(a)}(${V(v)}${signed(b)})`, N(c)),
          St(`Distribute: multiply ${N(a)} by ${V(v)} and by ${N(b)}.`, `${coef(a)}${V(v)}${signed(ab)}`, N(c)),
          St(`${ab > 0 ? 'Subtract' : 'Add'} ${Math.abs(ab)} ${ab > 0 ? 'from' : 'to'} both sides.`, `${coef(a)}${V(v)}`, N(c - ab), `${ab > 0 ? M : '+'} ${Math.abs(ab)}`),
          St(`Divide both sides by ${N(a)}.`, V(v), N(x), `÷ ${paren(a)}`),
        ],
      };
    },
  },
  {
    id: 'int',
    group: 'Number sense',
    name: 'Integer operations',
    op: '',
    gen() {
      let t: number[], ops: string[], s1: number, s2: number;
      do {
        t = [NZ(-15, 15), NZ(-15, 15), NZ(-12, 12)];
        ops = [pick(['+', M]), pick(['+', M])];
        s1 = ops[0] === M ? -t[1] : t[1];
        s2 = ops[1] === M ? -t[2] : t[2];
      } while (t[0] + s1 + s2 === 0 || Math.abs(t[0] + s1 + s2) > 9);
      const mid = t[0] + s1, ans = mid + s2;
      const q = `${N(t[0])}${o(ops[0])}${paren(t[1])}${o(ops[1])}${paren(t[2])}`;
      const work = [W(q, '')];
      if (ops.includes(M)) work.push(St(`Subtracting a number is the same as adding its opposite.`, '', `${N(t[0])}${o('+')}${paren(s1)}${o('+')}${paren(s2)}`));
      work.push(St(`Add the first two: ${N(t[0])} + ${paren(s1)} = ${N(mid)}.`, '', `${N(mid)}${o('+')}${paren(s2)}`));
      work.push(St(`Add the last number.`, '', N(ans)));
      return { inst: `Evaluate.`, q, lhs: '', ans: F(ans), work };
    },
  },
  {
    id: 'frac',
    group: 'Number sense',
    name: 'Adding fractions',
    op: '',
    gen() {
      const D = [2, 3, 4, 5, 6, 8, 10, 12];
      let qd: number, sd: number, p: number, r: number, op: string, L: number, P: number, Q: number, num: number;
      do {
        qd = pick(D);
        sd = pick(D);
        p = R(1, 2 * qd);
        r = R(1, 2 * sd);
        op = pick(['+', '+', M]);
        L = lcm(qd, sd);
        P = (p * L) / qd;
        Q = (r * L) / sd;
        num = op === '+' ? P + Q : P - Q;
      } while (num === 0 || num % L !== 0 || Math.abs(num / L) > 9 || gcd(p, qd) !== 1 || gcd(r, sd) !== 1);
      const ans = F(num, L), q = `${FR(p, qd)}${o(op)}${FR(r, sd)}`;
      const work = [W(q, '')];
      if (qd !== sd) work.push(St(`Rewrite both fractions over ${L}, the least common multiple of ${qd} and ${sd}.`, '', `${FR(P, L)}${o(op)}${FR(Q, L)}`));
      work.push(St(`${op === '+' ? 'Add' : 'Subtract'} the numerators. The denominator stays ${L}.`, '', FR(`${P}${o(op)}${Q}`, L)));
      work.push(St(`Work out the top.`, '', `${num < 0 ? M : ''}${FR(Math.abs(num), L)}`));
      work.push(St(`Divide: ${Math.abs(num)} ÷ ${L} = ${Math.abs(num / L)}.`, '', fH(ans)));
      return { inst: `Evaluate. The answer is a whole number.`, q, lhs: '', ans, work };
    },
  },
  {
    id: 'pct',
    group: 'Number sense',
    name: 'Percent of a number',
    op: '%',
    gen() {
      let p: number, k: number, n: number;
      do {
        p = pick([5, 10, 20, 25, 30, 40, 50, 60, 75, 150]);
        k = R(1, 9);
        n = (k * 100) / p;
      } while (!Number.isInteger(n) || n < 4);
      const ans = F(k), q = `${p}%<span class="mt">of</span>${n}`;
      return {
        inst: `Find the value.`,
        q,
        lhs: '',
        ans,
        fmt: 'dec',
        work: [
          W(q, ''),
          St(`Percent means “out of 100”, so ${p}% = ${dec(p / 100)}. “Of” means multiply.`, '', `${dec(p / 100)}${o('×')}${n}`),
          St(`Multiply.`, '', fDec(ans)),
        ],
      };
    },
  },
  {
    id: 'slope',
    group: 'Graphing',
    name: 'Slope from a graph',
    op: '',
    gen() {
      let x1: number, y1: number, dx: number, dy: number;
      do {
        x1 = R(-5, 4);
        dx = R(1, 3);
        y1 = R(-5, 5);
        dy = NZ(-4, 4) * dx;
      } while (x1 + dx > 5 || y1 + dy > 5 || y1 + dy < -5);
      const x2 = x1 + dx, y2 = y1 + dy, ans = F(dy, dx), m = V('m');
      const work = [
        W(m, FR(`${V('y')}<sub>2</sub>${o(M)}${V('y')}<sub>1</sub>`, `${V('x')}<sub>2</sub>${o(M)}${V('x')}<sub>1</sub>`)),
        St(
          `Use the two marked points (${N(x1)}, ${N(y1)}) and (${N(x2)}, ${N(y2)}). Slope is the change in ${V('y')} over the change in ${V('x')}.`,
          m,
          FR(`${N(y2)}${o(M)}${paren(y1)}`, `${N(x2)}${o(M)}${paren(x1)}`),
        ),
        St(`Rise over run: the line goes ${dy > 0 ? 'up' : 'down'} ${Math.abs(dy)} while it moves right ${dx}.`, m, FR(N(dy), dx)),
        St(`Simplify.`, m, fH(ans)),
      ];
      return {
        inst: `Find the slope of the line.`,
        q: graphSVG(x1, y1, x2, y2),
        sample: graphSVG(x1, y1, x2, y2, true),
        lhs: `${m}${EQ}`,
        ans,
        work,
      };
    },
  },
];

export const ansHTML = (pr: Problem): string => (pr.fmt === 'dec' ? fDec(pr.ans) : fH(pr.ans));
export const topicName = (t: Topic): string => t.name + (t.op ? ` (${t.op})` : '');
export const findTopic = (id: string): Topic | undefined => TOPICS.find((t) => t.id === id);
