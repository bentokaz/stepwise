/**
 * Criterion C test prep: simultaneous equations by substitution, elimination and graphing,
 * plus "explain the step" questions. Working follows the class layout: equations labelled (1), (2),
 * multiplied equations noted like {(1) × 5}, back-substitution, a check with ✓, then the solution pair.
 * Solutions are whole numbers.
 */
import { F, NZ, R, lcm, pick, type Frac } from './core';
import { EQ, MINUS as M, N, V, fH, o, paren } from './html';
import type { Problem, Row, Step, Topic } from './topics';
import { stepsHTML } from './workhtml';

const XY = ['x', 'y'] as const;
const GROUP = 'Criterion C test prep';

/**
 * Joins signed terms: each item is [coefficient, body]. A body of '' is a constant;
 * a coefficient of ±1 hides the 1 when there is a body, e.g. [[3, V('x')], [-1, V('y')], [5, '']] → "3x − y + 5".
 */
export function join(items: [number, string][]): string {
  let s = '';
  for (const [c, body] of items) {
    if (c === 0) continue;
    const abs = Math.abs(c);
    const text = body ? (abs === 1 ? '' : String(abs)) + body : String(abs);
    s += s ? o(c < 0 ? M : '+') + text : (c < 0 ? M : '') + text;
  }
  return s || '0';
}

/** ax + by with the variables in x, y order. */
const lin = (a: number, b: number) => join([[a, V('x')], [b, V('y')]]);
const lbl = (s: string) => `<span class="lbl">${s}</span>`;
/** Two equations with a curly brace, labelled (1) and (2). */
export const system = (a: string, b: string): string =>
  `<span class="sys"><span class="brace">{</span><span class="eqs"><span>${a}${lbl('(1)')}</span><span>${b}${lbl('(2)')}</span></span></span>`;
export const pairHTML = ([x, y]: [Frac, Frac]): string => `${V('x')}${EQ}${fH(x)}, &nbsp;${V('y')}${EQ}${fH(y)}`;
const W = (l: string, r: string): Step => ({ l, r });
const St = (why: string, extra: Partial<Step>): Step => ({ l: '', r: '', why, ...extra });
const solutionStep = (x: number, y: number): Step =>
  St('State the solution pair: the values that make both equations true.', { full: pairHTML([F(x), F(y)]) });
const checkLine = (a: number, b: number, c: number, x: number, y: number) =>
  `${join([[a, `(${N(x)})`], [b, `(${N(y)})`]])}${EQ}${N(c)} ✓`;

/* ---------------- substitution ---------------- */

function substitution(): Problem {
  for (;;) {
    const v = [R(-6, 6), R(-6, 6)];
    const si = pick([1, 1, 0]); // index of the subject variable in (1): usually y
    const ti = 1 - si;
    const s = XY[si], t = XY[ti];
    const m = NZ(-4, 4);
    const k = v[si] - m * v[ti];
    const co = [NZ(-5, 5), NZ(-5, 5)];
    const A = co[ti] + co[si] * m;
    const c = co[0] * v[0] + co[1] * v[1];
    if (Math.abs(k) > 12 || A === 0 || Math.abs(c) > 40 || (v[0] === 0 && v[1] === 0)) continue;
    const csk = co[si] * k;
    const sub = join([[m, V(t)], [k, '']]);
    const eq1 = `${V(s)}${EQ}${sub}`;
    const eq2 = `${lin(co[0], co[1])}${EQ}${N(c)}`;

    const subbed = join([0, 1].map((i): [number, string] => (i === si ? [co[si], `(${sub})`] : [co[ti], V(t)])));
    const expanded = join([0, 1].flatMap((i): [number, string][] => (i === si ? [[co[si] * m, V(t)], [csk, '']] : [[co[ti], V(t)]])));
    const collected = join([[A, V(t)], [csk, '']]);

    const work: Step[] = [
      {
        l: '',
        r: '',
        rows: [
          { l: V(s), r: sub, tag: '…. (1)' },
          { l: lin(co[0], co[1]), r: N(c), tag: '…. (2)' },
        ],
      },
      St(`Equation (1) has ${V(s)} as the subject, so substitute (1) into (2). Keep the brackets around the expression.`, { l: subbed, r: N(c) }),
    ];
    if (co[si] !== 1) work.push(St('Expand the brackets.', { l: `∴ ${expanded}`, r: N(c) }));
    if (expanded !== collected) work.push(St('Collect like terms.', { l: `∴ ${collected}`, r: N(c) }));
    if (csk !== 0)
      work.push(
        St(`${csk > 0 ? 'Subtract' : 'Add'} ${Math.abs(csk)} ${csk > 0 ? 'from' : 'to'} both sides.`, {
          l: `∴ ${join([[A, V(t)]])}`,
          r: N(c - csk),
          op: `${csk > 0 ? M : '+'} ${Math.abs(csk)}`,
        }),
      );
    if (A !== 1) work.push(St(`Divide both sides by ${N(A)}.`, { l: `∴ ${V(t)}`, r: N(v[ti]), op: `÷ ${paren(A)}` }));
    work.push(
      St(`Substitute ${V(t)} = ${N(v[ti])} back into (1) to find ${V(s)}.`, {
        rows: [
          { l: V(s), r: join([[m, `(${N(v[ti])})`], [k, '']]) },
          { l: `∴ ${V(s)}`, r: N(v[si]) },
        ],
      }),
      St('Check the pair in equation (2).', { full: checkLine(co[0], co[1], c, v[0], v[1]) }),
      solutionStep(v[0], v[1]),
    );
    return {
      inst: 'Solve simultaneously by substitution.',
      q: system(eq1, eq2),
      lhs: '',
      ans: F(v[0]),
      kind: 'pair',
      pair: [F(v[0]), F(v[1])],
      work,
    };
  }
}

/* ---------------- elimination ---------------- */

function elimination(): Problem {
  for (;;) {
    const v = [R(-6, 6), R(-6, 6)];
    const ei = pick([1, 1, 0]); // variable to eliminate: usually y
    const ui = 1 - ei;
    const c1 = [NZ(-5, 5), NZ(-5, 5)];
    const c2 = [NZ(-5, 5), NZ(-5, 5)];
    if (Math.random() < 0.3) c2[ei] = -c1[ei]; // already opposite: just add
    const det = c1[0] * c2[1] - c1[1] * c2[0];
    if (det === 0 || (v[0] === 0 && v[1] === 0)) continue;
    const p1 = c1[ei], p2 = c2[ei], L = lcm(Math.abs(p1), Math.abs(p2));
    const m1 = L / Math.abs(p1);
    const m2 = (Math.sign(p1) === Math.sign(p2) ? -1 : 1) * (L / Math.abs(p2));
    const r1 = c1[0] * v[0] + c1[1] * v[1], r2 = c2[0] * v[0] + c2[1] * v[1];
    if (m1 > 4 || Math.abs(m2) > 5 || Math.abs(r1) > 40 || Math.abs(r2) > 40) continue;
    const U = m1 * c1[ui] + m2 * c2[ui], RHS = m1 * r1 + m2 * r2;
    const e = XY[ei], u = XY[ui];

    const work: Step[] = [
      {
        l: '',
        r: '',
        rows: [
          { l: lin(c1[0], c1[1]), r: N(r1), tag: '…. (1)' },
          { l: lin(c2[0], c2[1]), r: N(r2), tag: '…. (2)' },
        ],
      },
    ];
    let la = '(1)', lb = '(2)';
    if (m1 !== 1 || m2 !== 1) {
      const rows: Row[] = [];
      let next = 3;
      if (m1 !== 1) {
        la = `(${next++})`;
        rows.push({ l: lin(m1 * c1[0], m1 * c1[1]), r: N(m1 * r1), tag: `${la} {(1) × ${paren(m1)}}` });
      }
      if (m2 !== 1) {
        lb = `(${next++})`;
        rows.push({ l: lin(m2 * c2[0], m2 * c2[1]), r: N(m2 * r2), tag: `${lb} {(2) × ${paren(m2)}}` });
      }
      const how = [m1 !== 1 ? `multiply (1) by ${N(m1)}` : '', m2 !== 1 ? `multiply (2) by ${N(m2)}` : ''].filter(Boolean).join(' and ');
      work.push(St(`Make the coefficients of ${V(e)} the same size but opposite in sign: ${how}.`, { rows }));
    }
    work.push(St(`Add ${la} and ${lb}. The ${V(e)} terms cancel out.`, { l: `${join([[U, V(u)]])}`, r: N(RHS) }));
    if (U !== 1) work.push(St(`Divide both sides by ${N(U)}.`, { l: `∴ ${V(u)}`, r: N(v[ui]), op: `÷ ${paren(U)}` }));
    const known = c1[ui] * v[ui];
    const rows: Row[] = [
      { l: join([0, 1].map((i): [number, string] => (i === ui ? [c1[ui], `(${N(v[ui])})`] : [c1[ei], V(e)]))), r: N(r1) },
    ];
    if (known !== 0)
      rows.push({ l: `∴ ${join([0, 1].map((i): [number, string] => (i === ui ? [known, ''] : [c1[ei], V(e)])))}`, r: N(r1) });
    work.push(St(`Substitute ${V(u)} = ${N(v[ui])} into (1).`, { rows }));
    if (known !== 0)
      work.push(
        St(`${known > 0 ? 'Subtract' : 'Add'} ${Math.abs(known)} ${known > 0 ? 'from' : 'to'} both sides.`, {
          l: `∴ ${join([[c1[ei], V(e)]])}`,
          r: N(r1 - known),
          op: `${known > 0 ? M : '+'} ${Math.abs(known)}`,
        }),
      );
    if (c1[ei] !== 1) work.push(St(`Divide both sides by ${N(c1[ei])}.`, { l: `∴ ${V(e)}`, r: N(v[ei]), op: `÷ ${paren(c1[ei])}` }));
    work.push(St('Check the pair in equation (2).', { full: checkLine(c2[0], c2[1], r2, v[0], v[1]) }), solutionStep(v[0], v[1]));
    return {
      inst: 'Solve simultaneously by elimination.',
      q: system(`${lin(c1[0], c1[1])}${EQ}${N(r1)}`, `${lin(c2[0], c2[1])}${EQ}${N(r2)}`),
      lhs: '',
      ans: F(v[0]),
      kind: 'pair',
      pair: [F(v[0]), F(v[1])],
      work,
    };
  }
}

/* ---------------- choosing the multiplier ---------------- */

function multiplier(): Problem {
  for (;;) {
    const co = [NZ(-6, 6), NZ(-6, 6)];
    const c = R(-12, 12);
    const vi = pick([0, 1]);
    const m = NZ(-5, 5, [0, 1]);
    const T = co[vi] * m;
    if (Math.abs(T) > 30) continue;
    const eq = `${lin(co[0], co[1])}${EQ}${N(c)}`;
    return {
      inst: `What do you multiply this equation by so the coefficient of ${V(XY[vi])} becomes ${N(T)}?`,
      q: eq,
      lhs: 'Multiply by',
      ans: F(m),
      work: [
        W(lin(co[0], co[1]), N(c)),
        St(`The coefficient of ${V(XY[vi])} is ${N(co[vi])} and you need ${N(T)}. Divide to find the multiplier.`, {
          full: `${N(T)} ÷ ${paren(co[vi])}${EQ}${N(m)}`,
        }),
        St(`Multiply every term on both sides by ${N(m)}, including the number on the right.`, {
          l: lin(m * co[0], m * co[1]),
          r: N(m * c),
          op: `× ${paren(m)}`,
        }),
        St(`The multiplier is ${N(m)}.`, { full: N(m) }),
      ],
    };
  }
}

/* ---------------- graphing (table of values) ---------------- */

type Line = { m: number; k: number; std?: [number, number, number] };
const yAt = (ln: Line, x: number) => ln.m * x + ln.k;
const lineEq = (ln: Line) =>
  ln.std ? `${lin(ln.std[0], ln.std[1])}${EQ}${N(ln.std[2])}` : `${V('y')}${EQ}${join([[ln.m, V('x')], [ln.k, '']])}`;

const lineRow = (ln: Line, tag: string): Row =>
  ln.std ? { l: lin(ln.std[0], ln.std[1]), r: N(ln.std[2]), tag } : { l: V('y'), r: join([[ln.m, V('x')], [ln.k, '']]), tag };

const toStd = (ln: Line, scale = 1): [number, number, number] => [-ln.m * scale, scale, ln.k * scale]; // −mx + y = k
const LIM = 8;

/**
 * The grid with both lines' table points and lines. The plotted layer stays hidden
 * until the page adds `plotted` to the question (CSS draws it in).
 */
function plotSVG(a: Line, b: Line, xs: number[], dashed: boolean, hit?: [number, number]): string {
  let g = '';
  for (let i = -LIM; i <= LIM; i++) {
    g += `<line class="gl" x1="${i}" y1="-8.5" x2="${i}" y2="8.5"/><line class="gl" x1="-8.5" y1="${i}" x2="8.5" y2="${i}"/>`;
  }
  g += `<line class="ax" x1="-8.5" y1="0" x2="8.5" y2="0"/><line class="ax" x1="0" y1="-8.5" x2="0" y2="8.5"/>`;
  let lb = `<text class="lb ax-n" x="8.55" y="-.25" text-anchor="end">x</text><text class="lb ax-n" x=".25" y="-8.1">y</text>`;
  for (let i = -LIM + 2; i <= LIM - 2; i += 2) {
    if (!i) continue;
    lb += `<text class="lb" x="${i}" y=".8" text-anchor="middle">${N(i)}</text><text class="lb" x="-.3" y="${-i + 0.2}" text-anchor="end">${N(i)}</text>`;
  }
  const n = xs.length;
  const seg = (ln: Line, cls: string, d: number) =>
    `<line class="${cls}" data-l="${d === n ? 0 : 1}" pathLength="1" style="--d:${d}" x1="-9" y1="${-yAt(ln, -9)}" x2="9" y2="${-yAt(ln, 9)}"/>`;
  const pts = (ln: Line, cls: string, d0: number) =>
    xs.map((x, j) => `<circle class="${cls}" data-p="${x},${yAt(ln, x)}" style="--d:${d0 + j}" cx="${x}" cy="${-yAt(ln, x)}" r=".27"/>`).join('');
  const hitDot = hit ? `<circle class="hit" cx="${hit[0]}" cy="${-hit[1]}" r=".5"/>` : '';
  return `<svg class="gsv" viewBox="-8.8 -8.8 17.6 17.6" role="img" aria-label="Grid for plotting both lines"><rect class="bgr" x="-8.8" y="-8.8" width="17.6" height="17.6"/>
    <g transform="scale(1,-1)">${g}</g>${lb}<g class="plot">${seg(a, 'ln', n)}${seg(b, dashed ? 'ln2 dash' : 'ln2', 2 * n + 1)}${pts(a, 'pt1', 0)}${pts(b, 'pt2', n + 1)}${hitDot}</g></svg>`;
}

/** A table of values: x row given, y row as inputs (question) or filled in (working). */
function valueTable(ln: Line, xs: number[], li: number, inputs: boolean): string {
  const ys = xs.map(
    (x, j) =>
      `<td>${
        inputs
          ? `<input class="tc" data-l="${li}" data-j="${j}" autocomplete="off" spellcheck="false" aria-label="y in table ${li + 1} when x is ${N(x)}">`
          : N(yAt(ln, x))
      }</td>`,
  );
  return `<table class="vt${inputs ? '' : ' mini'}"><tr><th>${V('x')}</th>${xs.map((x) => `<td>${N(x)}</td>`).join('')}</tr><tr><th>${V('y')}</th>${ys.join('')}</tr></table>`;
}

/** "For example, when x = 2: y = 2(2) + 1 = 5" (or the standard-form version). */
function tableWhy(ln: Line, label: string, x: number): string {
  const y = yAt(ln, x);
  const sub = `(${N(x)})`;
  if (!ln.std)
    return `Make a table of values for ${label}: substitute each ${V('x')} value to get ${V('y')}. For example, when ${V('x')}${EQ}${N(x)}: ${V('y')}${EQ}${join([[ln.m, sub], [ln.k, '']])}${EQ}${N(y)}.`;
  const [a, b, c] = ln.std;
  return `Make a table of values for ${label}: substitute each ${V('x')} value and solve for ${V('y')}. For example, when ${V('x')}${EQ}${N(x)}: ${join([[a, sub], [b, V('y')]])}${EQ}${N(c)}, so ${V('y')}${EQ}${N(y)}.`;
}

function tableProblem(a: Line, b: Line, xs: number[], dashed: boolean, finish: Pick<Problem, 'kind' | 'pair' | 'choices' | 'correct' | 'ans'> & { steps: Step[]; inst2: string; hit?: [number, number] }): Problem {
  const ex = xs.find((x) => x !== 0) ?? xs[0];
  const blk = (ln: Line, li: number, cls: string) =>
    `<div class="tblk"><div class="teq"><span class="key ${cls}"></span>${lineEq(ln)}${lbl(`(${li + 1})`)}</div>${valueTable(ln, xs, li, true)}</div>`;
  return {
    inst: 'Step 1 of 3: complete the table of values for each equation.',
    inst2: finish.inst2,
    q: `<div class="gq tq">${plotSVG(a, b, xs, dashed)}<div class="tside">${blk(a, 0, 'c1')}${blk(b, 1, 'c2')}</div></div>`,
    sample: system(lineEq(a), lineEq(b)),
    lhs: '',
    ans: finish.ans,
    kind: finish.kind,
    pair: finish.pair,
    choices: finish.choices,
    correct: finish.correct,
    table: { xs, ys: [xs.map((x) => yAt(a, x)), xs.map((x) => yAt(b, x))] },
    work: [
      { l: '', r: '', rows: [lineRow(a, '…. (1)'), lineRow(b, '…. (2)')] },
      St(tableWhy(a, 'equation (1)', ex), { full: valueTable(a, xs, 0, false) }),
      St(tableWhy(b, 'equation (2)', ex), { full: valueTable(b, xs, 1, false) }),
      St('Plot the points from each table and join each set with a straight line.', {
        full: plotSVG(a, b, xs, dashed, finish.hit).replace('class="gsv"', 'class="gsv mini plotted"'),
      }),
      ...finish.steps,
    ],
  };
}

/** Four x values in a row, like 0, 1, 2, 3. */
const xsFrom = (start: number) => [start, start + 1, start + 2, start + 3];
const fits = (ln: Line, xs: number[]) => xs.every((x) => Math.abs(yAt(ln, x)) <= LIM - 1) && Math.abs(ln.k) <= LIM;

function graphing(): Problem {
  const roll = Math.random();
  const slopes = [-3, -2, -1, 1, 2, 3];
  if (roll < 0.8) {
    for (;;) {
      const start = R(-2, 1);
      const xs = xsFrom(start);
      const x0 = R(start, start + 3), y0 = R(-5, 5);
      const m1 = pick(slopes), m2 = pick(slopes);
      const a: Line = { m: m1, k: y0 - m1 * x0 }, b: Line = { m: m2, k: y0 - m2 * x0 };
      if (m1 === m2 || !fits(a, xs) || !fits(b, xs)) continue;
      if (Math.random() < 0.35) b.std = toStd(b, pick([1, -1]));
      const check = (ln: Line) =>
        ln.std ? checkLine(ln.std[0], ln.std[1], ln.std[2], x0, y0) : `${N(y0)}${EQ}${join([[ln.m, `(${N(x0)})`], [ln.k, '']])} ✓`;
      return tableProblem(a, b, xs, false, {
        inst2: 'Step 3 of 3: where do the lines cross?',
        ans: F(x0),
        kind: 'pair',
        pair: [F(x0), F(y0)],
        hit: [x0, y0],
        steps: [
          St(`The lines cross at (${N(x0)}, ${N(y0)}). Both tables give ${V('y')}${EQ}${N(y0)} when ${V('x')}${EQ}${N(x0)}.`, {
            full: `(${N(x0)}, ${N(y0)})`,
          }),
          St('Check the point in both equations.', {
            full: `${check(a)}<span class="tag">(1)</span><br>${check(b)}<span class="tag">(2)</span>`,
          }),
          solutionStep(x0, y0),
        ],
      });
    }
  }
  const options = ['One solution', 'No solution', 'Infinitely many solutions'];
  const inst2 = 'Step 3 of 3: how many solutions are there?';
  if (roll < 0.9) {
    for (;;) {
      const xs = xsFrom(R(-2, 1));
      const m = pick(slopes);
      const a: Line = { m, k: R(-5, 5) }, b: Line = { m, k: R(-5, 5) };
      if (a.k === b.k || !fits(a, xs) || !fits(b, xs)) continue;
      if (Math.random() < 0.35) b.std = toStd(b, pick([1, -1]));
      return tableProblem(a, b, xs, false, {
        inst2,
        ans: F(0),
        kind: 'choice',
        choices: options,
        correct: 1,
        steps: [
          St(
            `The lines are parallel: both have gradient ${N(m)} (${V('y')} changes by ${N(m)} each time ${V('x')} goes up by 1) but they cross the ${V('y')}-axis at different places (${N(a.k)} and ${N(b.k)}). They never meet.`,
            { full: 'No solution' },
          ),
        ],
      });
    }
  }
  for (;;) {
    const xs = xsFrom(R(-2, 1));
    const a: Line = { m: pick(slopes), k: R(-5, 5) };
    if (!fits(a, xs)) continue;
    const scale = pick([2, -2, 3]);
    const b: Line = { m: a.m, k: a.k, std: toStd(a, scale) };
    return tableProblem(a, b, xs, true, {
      inst2,
      ans: F(0),
      kind: 'choice',
      choices: options,
      correct: 2,
      steps: [
        St('Both tables are exactly the same, so the lines lie on top of each other (coincident). Every point on the line works.', {
          full: 'Infinitely many solutions',
        }),
      ],
    });
  }
}

/* ---------------- explain the step (Criterion C) ---------------- */

const WRONG_REASONS = [
  `Square both sides of the equation.`,
  `Subtract equation (1) from itself.`,
  `Swap the values of ${V('x')} and ${V('y')}.`,
  `Multiply only the left-hand side by 2.`,
  `Add the two coefficients together.`,
  `Divide both sides by ${V('x')}.`,
];

function explain(): Problem {
  for (;;) {
    const base = pick([substitution, elimination])();
    const candidates = base.work.map((_, i) => i).filter((i) => i > 0 && i < base.work.length - 1);
    const idx = pick(candidates);
    const right = base.work[idx].why!;
    const pool = [
      ...base.work.filter((st, i) => i > 0 && i !== idx && st.why && st.why !== right).map((st) => st.why!),
      ...WRONG_REASONS,
    ];
    const wrong: string[] = [];
    for (const w of pool.sort(() => Math.random() - 0.5)) if (!wrong.includes(w) && wrong.length < 3) wrong.push(w);
    if (wrong.length < 3) continue;
    const choices = [right, ...wrong].sort(() => Math.random() - 0.5);
    const method = base.inst.includes('substitution') ? 'substitution' : 'elimination';
    return {
      inst: `This is part of a solution by ${method}. Which explanation matches step ${idx}?`,
      q: `<div class="exq"><div class="wg small">${stepsHTML(base.work, { shown: idx, newFrom: Infinity, hideWhyAt: idx, highlight: idx })}</div></div>`,
      sample: `<span class="mt" style="font-size:15px">Explain step 2</span>`,
      lhs: '',
      ans: F(0),
      kind: 'choice',
      choices,
      correct: choices.indexOf(right),
      work: base.work,
    };
  }
}

export const SIM_TOPICS: Topic[] = [
  { id: 'sim-sub', group: GROUP, name: 'Simultaneous: substitution', op: '', gen: substitution },
  { id: 'sim-mult', group: GROUP, name: 'Elimination: pick the multiplier', op: '', gen: multiplier },
  { id: 'sim-elim', group: GROUP, name: 'Simultaneous: elimination', op: '', gen: elimination },
  { id: 'sim-graph', group: GROUP, name: 'Simultaneous: graphs', op: '', gen: graphing },
  { id: 'sim-explain', group: GROUP, name: 'Explain the working', op: '', gen: explain },
];
