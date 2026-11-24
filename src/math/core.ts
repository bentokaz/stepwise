/** Exact rational numbers and small random helpers used by the question generators. */

export interface Frac {
  n: number;
  d: number;
}

export const gcd = (a: number, b: number): number => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

export const lcm = (a: number, b: number): number => Math.abs(a * b) / gcd(a, b);

/** A reduced fraction with a positive denominator. */
export const F = (n: number, d = 1): Frac => {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  // `+ 0` turns -0 into 0
  return { n: n / g + 0, d: d / g };
};

export const feq = (a: Frac, b: Frac): boolean => a.n === b.n && a.d === b.d;

/** Random integer in [a, b]. */
export const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));

/** Random integer in [a, b] that is not in `ex` (0 by default). */
export const NZ = (a: number, b: number, ex: number[] = [0]): number => {
  let v: number;
  do v = R(a, b);
  while (ex.includes(v));
  return v;
};

export const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
