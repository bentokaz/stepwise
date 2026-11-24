/** Sends reports to the collector. Failed sends wait in localStorage and retry on the next visit. */
import { FEEDBACK_URL } from '../config';
import type { Report } from './report';

const OUTBOX = 'stepwise-feedback-outbox';

export const feedbackConfigured = (): boolean => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(FEEDBACK_URL);

async function post(report: Report): Promise<void> {
  // text/plain keeps this a "simple" request, so the browser sends it without a CORS preflight
  const res = await fetch(FEEDBACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(report),
    redirect: 'follow',
  });
  const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
  if (!res.ok || !data?.ok) throw new Error('Collector refused the report');
}

const readOutbox = (): Report[] => {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX) || '[]') as Report[];
  } catch {
    return [];
  }
};
const writeOutbox = (items: Report[]) => {
  try {
    if (items.length) localStorage.setItem(OUTBOX, JSON.stringify(items.slice(-10)));
    else localStorage.removeItem(OUTBOX);
  } catch {
    /* storage blocked */
  }
};

/** 'sent' on success; 'queued' when it couldn't send now but will retry later. */
export async function sendReport(report: Report): Promise<'sent' | 'queued'> {
  if (!feedbackConfigured()) throw new Error('not configured');
  try {
    await post(report);
    return 'sent';
  } catch {
    writeOutbox([...readOutbox(), report]);
    return 'queued';
  }
}

/** Retries anything left over from a failed send. */
export async function flushOutbox(): Promise<void> {
  if (!feedbackConfigured()) return;
  const pending = readOutbox();
  if (!pending.length) return;
  const left: Report[] = [];
  for (const r of pending) {
    try {
      await post(r);
    } catch {
      left.push(r);
    }
  }
  writeOutbox(left);
}
