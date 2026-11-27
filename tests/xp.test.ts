import { describe, expect, it } from 'vitest';
import { TOPICS, masteryBonus, xpBase, xpFor } from '../src/math/topics';

describe('XP', () => {
  it('harder lessons are worth more', () => {
    expect(xpBase('sim-graph')).toBeGreaterThan(xpBase('sim-sub'));
    expect(xpBase('sim-sub')).toBeGreaterThan(xpBase('two'));
    expect(xpBase('mus-essay')).toBeGreaterThan(xpBase('mus-vocab'));
  });
  it('every lesson has its own XP value', () => {
    for (const t of TOPICS) expect(xpBase(t.id), t.id).toBeGreaterThan(0);
  });
  it('second tries are worth half (rounded up); streaks add a bonus', () => {
    expect(xpFor('sim-graph', false, 0)).toBe(13);
    expect(xpFor('sim-graph', true, 1)).toBe(25);
    expect(xpFor('sim-graph', true, 3)).toBe(25 + 2 * 5);
  });
  it('the mastery bonus always lands on a multiple of 50', () => {
    for (const xp of [0, 1, 49, 50, 51, 437, 1499]) {
      const b = masteryBonus(xp);
      expect(b).toBeGreaterThan(0);
      expect((xp + b) % 50).toBe(0);
    }
  });
});
