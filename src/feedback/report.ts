/** Shape and validation of a feedback report (no DOM, so it can be unit-tested). */

export type FeedbackType = 'bug' | 'feature' | 'other';
export const FEEDBACK_TYPES: FeedbackType[] = ['bug', 'feature', 'other'];

export interface TechInfo {
  lesson: string;
  question: string;
  version: string;
  browser: string;
  platform: string;
  screen: string;
  viewport: string;
  language: string;
  timeZone: string;
  theme: string;
  reducedMotion: string;
  userAgent: string;
}

export interface FeedbackInput {
  type: FeedbackType;
  message: string;
  email: string;
  includeTech: boolean;
  /** Hidden honeypot field; people never fill it in, bots often do. */
  website?: string;
}

export interface Report {
  type: FeedbackType;
  message: string;
  email: string;
  tech: TechInfo | null;
  website: string;
  sentAt: string;
}

export const LIMITS = { message: 4000, email: 200, minMessage: 3 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns what's wrong with the form, or null when it can be sent. */
export function validate(input: Pick<FeedbackInput, 'message' | 'email'>): string | null {
  const msg = input.message.trim();
  if (msg.length < LIMITS.minMessage) return 'Write a few words about what happened or what you’d like.';
  if (msg.length > LIMITS.message) return `Keep it under ${LIMITS.message} characters.`;
  const email = input.email.trim();
  if (email && (email.length > LIMITS.email || !EMAIL_RE.test(email))) return 'That email doesn’t look right. Fix it or leave it empty.';
  return null;
}

export function buildReport(input: FeedbackInput, tech: TechInfo, now = new Date()): Report {
  return {
    type: FEEDBACK_TYPES.includes(input.type) ? input.type : 'other',
    message: input.message.trim().slice(0, LIMITS.message),
    email: input.email.trim().slice(0, LIMITS.email),
    tech: input.includeTech ? tech : null,
    website: input.website ?? '',
    sentAt: now.toISOString(),
  };
}

/** Readable list of the technical info, for the "See what's included" preview. */
export function describeTech(t: TechInfo): string {
  const rows: [string, string][] = [
    ['Lesson', t.lesson],
    ['Question', t.question],
    ['App version', t.version],
    ['Browser', t.browser],
    ['Platform', t.platform],
    ['Screen', t.screen],
    ['Window', t.viewport],
    ['Language', t.language],
    ['Time zone', t.timeZone],
    ['Theme', t.theme],
    ['Reduced motion', t.reducedMotion],
  ];
  return rows.map(([k, v]) => `${k.padEnd(15)}${v || '—'}`).join('\n');
}

/** Picks a readable browser name and version out of a user-agent string. */
export function browserName(ua: string): string {
  const tests: [RegExp, string][] = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/CriOS\/([\d.]+)/, 'Chrome (iOS)'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];
  for (const [re, name] of tests) {
    const m = ua.match(re);
    if (m) return `${name} ${m[1].split('.')[0]}`;
  }
  return 'Unknown';
}
