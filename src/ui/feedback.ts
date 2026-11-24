/** "Give feedback" dialog: pick a kind, write the report, optional email, optional technical info, send. */
import { browserName, buildReport, describeTech, LIMITS, validate, type FeedbackType, type TechInfo } from '../feedback/report';
import { feedbackConfigured, flushOutbox, sendReport } from '../feedback/send';
import { $, $$, reduceMotion } from './dom';

declare const __APP_VERSION__: string;

const PLACEHOLDER: Record<FeedbackType, string> = {
  bug: 'What happened, and what did you expect? If it was on a question, which one?',
  feature: 'What would you like Stepwise to do? A new lesson, a tool, a setting…',
  other: 'Anything you’d like to tell us.',
};
const COOLDOWN_MS = 20_000;

function collectTech(): TechInfo {
  const inPractice = !$('#practice').hidden;
  const q = $('#qmath');
  const dark =
    document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  return {
    lesson: inPractice ? $('#tname').textContent ?? '' : 'Lessons page',
    question: inPractice ? (q.querySelector('svg') ? q.querySelector('svg')!.getAttribute('aria-label') ?? 'graph' : (q.textContent ?? '').trim()) : '',
    version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev',
    browser: browserName(navigator.userAgent),
    platform: uaData?.platform || navigator.platform || '',
    screen: `${screen.width}×${screen.height} @${devicePixelRatio}x`,
    viewport: `${innerWidth}×${innerHeight}`,
    language: navigator.language,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    theme: dark ? 'dark' : 'light',
    reducedMotion: reduceMotion() ? 'on' : 'off',
    userAgent: navigator.userAgent,
  };
}

export function initFeedback(): void {
  const overlay = $('#fbk');
  const form = $<HTMLFormElement>('#fbkForm');
  const msg = $<HTMLTextAreaElement>('#fbkMsg');
  const email = $<HTMLInputElement>('#fbkEmail');
  const tech = $<HTMLInputElement>('#fbkTech');
  const techBox = $('#fbkTechBox');
  const techShow = $('#fbkTechShow');
  const err = $('#fbkErr');
  const send = $<HTMLButtonElement>('#fbkSend');
  const count = $('#fbkCount');
  const done = $('#fbkDone');
  let opener: HTMLElement | null = null;
  let lastSent = 0;

  const kind = (): FeedbackType => ($<HTMLInputElement>('input[name="fbtype"]:checked', form).value as FeedbackType) || 'other';
  const updateCount = () => (count.textContent = `${msg.value.length} / ${LIMITS.message}`);
  const updatePlaceholder = () => (msg.placeholder = PLACEHOLDER[kind()]);
  const updateTechBox = () => {
    techBox.textContent = describeTech(collectTech());
    techShow.hidden = !tech.checked;
    if (!tech.checked) {
      techBox.hidden = true;
      techShow.setAttribute('aria-expanded', 'false');
      techShow.textContent = 'See what’s included';
    }
  };

  function open(from: HTMLElement) {
    opener = from;
    form.hidden = false;
    done.hidden = true;
    err.textContent = '';
    if (!feedbackConfigured()) err.textContent = 'Sending isn’t set up on this copy of Stepwise yet, so reports can’t be sent.';
    updatePlaceholder();
    updateCount();
    updateTechBox();
    overlay.hidden = false;
    $<HTMLInputElement>('input[name="fbtype"]:checked', form).focus();
  }
  function close() {
    overlay.hidden = true;
    opener?.focus();
  }

  $$('[data-feedback]').forEach((b) => (b.onclick = () => open(b)));
  $$('input[name="fbtype"]', form).forEach((r) => r.addEventListener('change', updatePlaceholder));
  msg.addEventListener('input', () => {
    updateCount();
    if (err.textContent) err.textContent = '';
  });
  tech.addEventListener('change', updateTechBox);
  techShow.onclick = () => {
    const show = techBox.hidden;
    techBox.hidden = !show;
    techShow.setAttribute('aria-expanded', String(show));
    techShow.textContent = show ? 'Hide' : 'See what’s included';
  };
  $('#fbkClose').onclick = close;
  $('#fbkDoneClose').onclick = close;
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) close();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const problem = validate({ message: msg.value, email: email.value });
    if (problem) {
      err.textContent = problem;
      (problem.includes('email') ? email : msg).focus();
      return;
    }
    if (!feedbackConfigured()) {
      err.textContent = 'Sending isn’t set up on this copy of Stepwise yet, so reports can’t be sent.';
      return;
    }
    const wait = COOLDOWN_MS - (Date.now() - lastSent);
    if (wait > 0) {
      err.textContent = `You just sent one. Try again in ${Math.ceil(wait / 1000)} seconds.`;
      return;
    }
    send.disabled = true;
    send.classList.add('busy');
    send.textContent = 'Sending…';
    const report = buildReport(
      { type: kind(), message: msg.value, email: email.value, includeTech: tech.checked, website: $<HTMLInputElement>('#fbkHp').value },
      collectTech(),
    );
    const result = await sendReport(report).catch(() => 'queued' as const);
    lastSent = Date.now();
    send.disabled = false;
    send.classList.remove('busy');
    send.textContent = 'Send';
    $('#fbkDoneTitle').textContent = result === 'sent' ? 'Sent. Thank you.' : 'Saved for later';
    $('#fbkDoneText').textContent =
      result === 'sent'
        ? 'Your report is in. Every one gets read.'
        : 'Stepwise couldn’t reach the server just now, so your report is saved in this browser. It will send by itself next time you open Stepwise.';
    form.reset();
    form.hidden = true;
    done.hidden = false;
    if (!reduceMotion()) done.querySelector('path')?.animate([{ strokeDashoffset: 60 }, { strokeDashoffset: 0 }], { duration: 450, delay: 120, fill: 'both', easing: 'cubic-bezier(.6,0,.2,1)' });
    $('#fbkDoneClose').focus();
  });

  void flushOutbox();
}
