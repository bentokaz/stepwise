import { describe, expect, it } from 'vitest';
import { browserName, buildReport, describeTech, LIMITS, validate, type TechInfo } from '../src/feedback/report';

const tech: TechInfo = {
  lesson: 'Two-step equations',
  question: '−7a+9=−54',
  version: 'abc1234',
  browser: 'Chrome 141',
  platform: 'macOS',
  screen: '1440×900 @2x',
  viewport: '1280×760',
  language: 'en-US',
  timeZone: 'America/New_York',
  theme: 'dark',
  reducedMotion: 'off',
  userAgent: 'Mozilla/5.0',
};

describe('validate', () => {
  it('needs a few words', () => {
    expect(validate({ message: '  ', email: '' })).toMatch(/few words/);
    expect(validate({ message: 'ok', email: '' })).toMatch(/few words/);
    expect(validate({ message: 'The graph froze', email: '' })).toBeNull();
  });
  it('caps the length', () => {
    expect(validate({ message: 'x'.repeat(LIMITS.message + 1), email: '' })).toMatch(/under/);
  });
  it('allows an empty email but rejects a malformed one', () => {
    expect(validate({ message: 'Hello there', email: 'me@school.org' })).toBeNull();
    expect(validate({ message: 'Hello there', email: 'not an email' })).toMatch(/email/);
  });
});

describe('buildReport', () => {
  const now = new Date('2026-11-24T12:00:00Z');
  it('includes technical info only when asked', () => {
    const base = { type: 'bug' as const, message: '  Broke  ', email: '', website: '' };
    expect(buildReport({ ...base, includeTech: true }, tech, now).tech).toEqual(tech);
    expect(buildReport({ ...base, includeTech: false }, tech, now).tech).toBeNull();
  });
  it('trims fields and stamps the time', () => {
    const r = buildReport({ type: 'feature', message: '  More lessons  ', email: ' a@b.co ', includeTech: false }, tech, now);
    expect(r).toEqual({ type: 'feature', message: 'More lessons', email: 'a@b.co', tech: null, website: '', sentAt: '2026-11-24T12:00:00.000Z' });
  });
  it('falls back to "other" for an unknown type', () => {
    expect(buildReport({ type: 'spam' as never, message: 'hello', email: '', includeTech: false }, tech, now).type).toBe('other');
  });
});

describe('browserName', () => {
  it.each([
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15', 'Safari 18'],
    ['Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'Chrome 141'],
    ['Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Edge 141'],
    ['Mozilla/5.0 (Macintosh; rv:133.0) Gecko/20100101 Firefox/133.0', 'Firefox 133'],
    ['curl/8', 'Unknown'],
  ])('%s → %s', (ua, want) => expect(browserName(ua)).toBe(want));
});

it('describeTech lists every field the reader sees', () => {
  const text = describeTech(tech);
  for (const v of ['Two-step equations', 'Chrome 141', 'America/New_York', 'abc1234']) expect(text).toContain(v);
});
