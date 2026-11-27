import { describe, expect, it } from 'vitest';
import { ESSAYS, RECALL, pointsFound } from '../src/music/written';

describe('written answers', () => {
  for (const w of [...RECALL, ...ESSAYS])
    it(`the model answer covers every key point: ${w.q.replace(/<[^>]+>/g, '').slice(0, 50)}`, () => {
      const found = pointsFound(w.points, w.model);
      expect(found.filter((f) => !f.ok).map((f) => f.label)).toEqual([]);
    });

  it('a vague answer does not pass', () => {
    const w = ESSAYS[0];
    expect(pointsFound(w.points, 'The music is scary and good.').every((f) => f.ok)).toBe(false);
  });

  it('matches word starts, ignoring case and punctuation', () => {
    const pts = [{ label: 'synch', any: ['synchron'] }];
    expect(pointsFound(pts, 'It was SYNCHRONISED!')[0].ok).toBe(true);
    expect(pointsFound(pts, 'unsynchronised')[0].ok).toBe(false);
  });
});
