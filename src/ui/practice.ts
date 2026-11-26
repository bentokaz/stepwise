/** The practice screen: question, two tries, scoring, keypad, tools tabs and the "lesson mastered" dialog. */
import { F, feq, pick } from '../math/core';
import { FR, MINUS, o } from '../math/html';
import { clean, parseAnswer } from '../math/parse';
import { GOAL, TOPICS, findTopic, topicName, type Problem } from '../math/topics';
import { S, progress, save } from '../state';
import { $, $$, reduceMotion, replayClass } from './dom';
import { bigWin, burstAt, confettiRain, floatXP } from './fx';
import { checkUnlocks, levelLabel, toastUnlock } from './rewards';
import { playScene, type SceneId } from './scene';
import type { Graph } from './graph';
import { fmtPts } from './menu';
import type { Notepad } from './notepad';
import { SPEAKER_OFF, SPEAKER_ON, sfx } from './sound';
import { walkthrough } from './walkthrough';

type Phase = 'ask' | 'solved' | 'revealed';

export interface Practice {
  open(id: string): void;
  /** True while this screen is showing. */
  active: boolean;
}

export function initPractice(go: (hash: string) => void, pad: Notepad, graph: Graph): Practice {
  const inp = $<HTMLInputElement>('#inp');
  const field = $('#field');
  const fb = $('#fb');
  const submit = $<HTMLButtonElement>('#submit');
  const prob = $('#prob');
  const qwrap = $('#qwrap');
  const overlay = $('#done');

  let P: Problem | null = null;
  let attempt = 1;
  let phase: Phase = 'ask';
  let qnum = 0;
  let lastWrong = '';
  const api: Practice = { open, active: false };

  const topic = () => findTopic(S.topic)!;

  /* ---------- header ---------- */
  function renderHead() {
    const t = topic();
    $('#grp').textContent = t.group;
    $('#tname').textContent = topicName(t);
    renderStats(false);
  }
  function setNum(sel: string, v: number, animate: boolean) {
    const el = $(sel);
    if (el.textContent === String(v)) return;
    el.textContent = String(v);
    if (animate && !reduceMotion())
      el.animate([{ transform: 'translateY(45%)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
        duration: 380,
        easing: 'cubic-bezier(.2,.8,.2,1)',
      });
  }
  function renderStats(animate: boolean) {
    const s = progress();
    $('#scoreTxt').textContent = `${fmtPts(s.pts)}/${GOAL}`;
    const segs = $('#segs');
    if (!segs.children.length) segs.innerHTML = '<i><b></b></i>'.repeat(GOAL);
    [...segs.children].forEach((seg, i) => {
      const w = Math.max(0, Math.min(1, s.pts - i)) * 100;
      const b = seg.firstElementChild as HTMLElement;
      const old = parseFloat(b.style.width) || 0;
      if (!animate) b.style.transition = 'none';
      b.style.width = w + '%';
      if (!animate) {
        void b.offsetWidth;
        b.style.transition = '';
      }
      if (animate && w > old && !reduceMotion()) replayClass(seg, 'pop');
    });
    setNum('#streak', S.streak, animate);
    setNum('#xp', S.xp, animate);
    $('#lvl').textContent = levelLabel();
    $('#dia').classList.toggle('dim', S.streak < 2);
  }

  /* ---------- questions ---------- */
  function setPips(state?: 'ok' | 'out') {
    const ps = $$('#pips i');
    ps.forEach((p, i) => {
      p.className = '';
      if (i < attempt - 1) p.classList.add('used');
    });
    if (state === 'ok') ps[attempt - 1].classList.add('ok');
    if (state === 'out') ps.forEach((p) => p.classList.add('used'));
    $('#attTxt').textContent = phase === 'ask' ? `Attempt ${attempt} of 2` : state === 'ok' ? 'Solved' : 'Out of tries';
  }

  /* answer modes: one number, an (x, y) pair, or tapping one option */
  const pairEl = $('#pair');
  const px = $<HTMLInputElement>('#px');
  const py = $<HTMLInputElement>('#py');
  const choicesEl = $('#choices');
  const kbtn = $('#kbtn');
  let activeInput: HTMLInputElement = inp;
  for (const el of [inp, px, py]) el.addEventListener('focus', () => (activeInput = el));
  /** Table-of-values questions start on the tables; the answer comes after. */
  let stage: 'table' | 'plot' | 'answer' = 'answer';
  let cells: HTMLInputElement[] = [];
  const mode = () => (stage !== 'answer' ? stage : (P?.kind ?? 'num'));
  const tableBox = () => $('#qmath').querySelector<HTMLElement>('.tside') ?? field;
  /** The element that shakes, glows and bursts for the current answer mode. */
  const answerBox = () => (mode() === 'pair' ? pairEl : mode() === 'table' ? tableBox() : field);

  /** Shows the answer controls for the current mode. */
  function showAnswerRow() {
    const m = mode();
    $('#lhs').hidden = !P!.lhs || m !== 'num';
    field.hidden = m !== 'num';
    pairEl.hidden = m !== 'pair';
    choicesEl.hidden = m !== 'choice';
    kbtn.hidden = m === 'choice' || m === 'plot';
    if (m === 'choice' || m === 'plot') keypad.hidden = true;
    submit.hidden = m === 'choice' || m === 'plot';
    choicesEl.classList.remove('done');
    if (m === 'choice') renderChoices();
  }

  /** Fills every table cell with the right value (marking ones the student got wrong), then plots. */
  function fillTables() {
    for (const c of cells) {
      const want = P!.table!.ys[+c.dataset.l!][+c.dataset.j!];
      if (!c.classList.contains('ok')) {
        c.value = String(want).replace('-', MINUS);
        c.className = 'tc fix';
      }
      c.disabled = true;
    }
  }
  const plot = () => $('#qmath').querySelector('.tq')?.classList.add('plotted');

  function wireCells() {
    cells = [...$('#qmath').querySelectorAll<HTMLInputElement>('input.tc')];
    cells.forEach((c, i) => {
      c.addEventListener('focus', () => (activeInput = c));
      c.addEventListener('input', () => c.classList.remove('bad'));
      c.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const next = cells.slice(i + 1).concat(cells.slice(0, i)).find((o) => !o.disabled && !o.value.trim());
        if (next) next.focus();
        else check();
      });
    });
  }

  /** Checks the tables: null after a hint (no try used), otherwise whether every cell is right. */
  function readTables(): { right: boolean; shown: string } | null {
    const open = cells.filter((c) => !c.disabled);
    const empty = open.find((c) => !c.value.trim());
    if (empty) {
      empty.focus();
      replayClass(tableBox(), 'shake');
      msg('nudge', `<span>Fill in every ${'<i class="mv">y</i>'} value first. That didn’t use a try.</span>`);
      return null;
    }
    const parsed = open.map((c) => parseAnswer(c.value.replace(MINUS, '-')));
    if (parsed.some((p) => !p.ok)) {
      msg('nudge', FORMAT_HELP);
      return null;
    }
    let right = true;
    open.forEach((c, i) => {
      const p = parsed[i];
      const ok = p.ok && feq(p.f, F(P!.table!.ys[+c.dataset.l!][+c.dataset.j!]));
      c.classList.toggle('ok', ok);
      c.classList.toggle('bad', !ok);
      if (ok) c.disabled = true;
      else right = false;
    });
    const rows = [0, 1].map((l) =>
      cells
        .filter((c) => +c.dataset.l! === l)
        .map((c) => escapeHTML(clean(c.value)).replace(/-/g, MINUS))
        .join(', '),
    );
    return { right, shown: `(1) ${rows[0]} &nbsp;(2) ${rows[1]}` };
  }

  /* ---------- step 2 of 3: tap the grid to plot each table point ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  let plotSvg: SVGSVGElement | null = null;
  let ghost: SVGGElement | null = null;

  /** Distinct table points still to plot. */
  const plotPoints = () => [...new Set([...(plotSvg?.querySelectorAll<SVGCircleElement>('.plot circle') ?? [])].map((c) => c.dataset.p!))];
  const plottedCount = () => plotPoints().filter((p) => plotSvg!.querySelector(`.plot circle.on[data-p="${p}"]`)).length;

  function plotMsg(extra = '') {
    const total = plotPoints().length;
    msg(
      extra ? 'retry' : 'good',
      `<div>${extra || `<b>Tables right.</b>`} <span class="sub">Tap the grid (or press and slide on a touchscreen) to plot each point from your tables. ${plottedCount()} of ${total} plotted.</span></div><button class="linkbtn" id="autoPlot">Plot them for me</button>`,
    );
    $('#autoPlot').onclick = () => {
      plot();
      plotDone();
    };
  }

  /** Grid coordinates (snapped to whole numbers) under a pointer, lifted `lift` px above it for fingers. */
  function gridPoint(e: PointerEvent, lift = 0): [number, number] | null {
    const m = plotSvg!.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(e.clientX, e.clientY - lift).matrixTransform(m.inverse());
    const x = Math.round(p.x), y = Math.round(-p.y);
    return Math.abs(x) <= 8 && Math.abs(y) <= 8 ? [x, y] : null;
  }
  const fmtPt = ([x, y]: [number, number]) => `(${String(x).replace('-', MINUS)}, ${String(y).replace('-', MINUS)})`;

  function startPlot() {
    stage = 'plot';
    plotSvg = $('#qmath').querySelector<SVGSVGElement>('.tq svg');
    const tq = $('#qmath').querySelector('.tq')!;
    tq.classList.add('plotting');
    $('#inst').innerHTML = 'Step 2 of 3: plot the points from both tables.';
    showAnswerRow();
    plotMsg();
    ghost = document.createElementNS(SVGNS, 'g') as unknown as SVGGElement;
    ghost.setAttribute('class', 'ghost');
    ghost.innerHTML = `<circle r=".34"/><text text-anchor="middle"></text>`;
    ghost.style.display = 'none';
    plotSvg!.appendChild(ghost);
    /** Touch and pen: press, slide, release. The ring floats above the finger with its coordinates. */
    let dragging = false;
    let at: [number, number] | null = null;
    const lift = (e: PointerEvent) => (e.pointerType === 'mouse' ? 0 : 44);
    const showGhost = (g: [number, number] | null) => {
      at = g;
      ghost!.style.display = g ? '' : 'none';
      if (!g) return;
      ghost!.setAttribute('transform', `translate(${g[0]} ${-g[1]})`);
      const t = ghost!.querySelector('text')!;
      t.textContent = fmtPt(g);
      t.setAttribute('y', g[1] > 6 ? '1.45' : '-.75');
    };
    plotSvg!.onpointermove = (e) => {
      if (e.pointerType === 'mouse' || dragging) showGhost(gridPoint(e, lift(e)));
    };
    plotSvg!.onpointerleave = () => {
      if (!dragging) showGhost(null);
    };
    plotSvg!.onpointerdown = (e) => {
      if (stage !== 'plot') return;
      e.preventDefault();
      if (e.pointerType === 'mouse') {
        const g = gridPoint(e);
        if (g) place(g);
        return;
      }
      dragging = true;
      showGhost(gridPoint(e, lift(e)));
      try {
        plotSvg!.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
    };
    plotSvg!.onpointerup = plotSvg!.onpointercancel = (e) => {
      if (!dragging) return;
      dragging = false;
      const g = at;
      showGhost(null);
      if (g && e.type === 'pointerup' && stage === 'plot') place(g);
    };
  }

  function place(g: [number, number]) {
    {
      const key = `${g[0]},${g[1]}`;
      const hits = [...plotSvg!.querySelectorAll<SVGCircleElement>(`.plot circle[data-p="${key}"]`)];
      if (!hits.length) {
        sfx.bad();
        const x = document.createElementNS(SVGNS, 'text');
        x.setAttribute('class', 'miss');
        x.setAttribute('x', String(g[0]));
        x.setAttribute('y', String(-g[1] + 0.3));
        x.setAttribute('text-anchor', 'middle');
        x.textContent = '×';
        plotSvg!.appendChild(x);
        setTimeout(() => x.remove(), 700);
        plotMsg(`<b>${fmtPt(g)} isn’t in either table.</b>`);
        return;
      }
      if (hits.every((h) => h.classList.contains('on'))) return;
      sfx.tap();
      hits.forEach((h) => h.classList.add('on'));
      // a line is drawn once all of its points are plotted
      for (const l of [0, 1]) {
        const cls = l ? 'pt2' : 'pt1';
        const all = [...plotSvg!.querySelectorAll(`.plot circle.${cls}`)];
        if (all.every((c) => c.classList.contains('on'))) plotSvg!.querySelector(`.plot line[data-l="${l}"]`)?.classList.add('on');
      }
      if (plottedCount() === plotPoints().length) setTimeout(plotDone, reduceMotion() ? 0 : 650);
      else plotMsg();
    }
  }

  function stopPlotting() {
    if (!plotSvg) return;
    plotSvg.onpointermove = plotSvg.onpointerdown = plotSvg.onpointerleave = plotSvg.onpointerup = plotSvg.onpointercancel = null;
    ghost?.remove();
    $('#qmath').querySelector('.tq')?.classList.remove('plotting');
    plotSvg = null;
  }

  function plotDone() {
    if (stage !== 'plot') return;
    stopPlotting();
    stage = 'answer';
    sfx.tap();
    $('#inst').innerHTML = P!.inst2 ?? P!.inst;
    submit.textContent = 'Submit';
    showAnswerRow();
    msg('good', `<div><b>Both lines drawn.</b> <span class="sub">Now read the graph.</span></div>`);
    activeInput = px;
    if (mode() === 'pair' && matchMedia('(hover:hover)').matches) px.focus({ preventScroll: true });
  }

  function tablesDone() {
    startPlot();
  }

  function renderChoices() {
    choicesEl.innerHTML = (P!.choices ?? [])
      .map((c, i) => `<button type="button" class="choice" data-i="${i}"><b>${'ABCD'[i]}</b><span>${c}</span></button>`)
      .join('');
  }

  function newQ(first = false) {
    const load = () => {
      let np: Problem;
      do np = topic().gen();
      while (P && np.q === P.q);
      P = np;
      attempt = 1;
      phase = 'ask';
      qnum++;
      lastWrong = '';
      stopPlotting();
      stage = P.table ? 'table' : 'answer';
      const m = mode();
      $('#inst').innerHTML = P.inst;
      $('#qmath').innerHTML = P.q;
      wireCells();
      // "explain the step": keep the highlighted step in view
      requestAnimationFrame(() => {
        const ex = $('#qmath').querySelector<HTMLElement>('.exq');
        if (ex) ex.scrollTop = ex.scrollHeight;
      });
      $('#lhs').innerHTML = P.lhs;
      $('#qn').textContent = `Question ${qnum}`;
      for (const el of [inp, px, py]) {
        el.value = '';
        el.disabled = false;
      }
      field.className = 'field';
      pairEl.className = 'pair';
      showAnswerRow();
      updPreview();
      fb.innerHTML = '';
      prob.classList.remove('solving');
      setPips();
      submit.textContent = m === 'table' ? 'Check tables' : 'Submit';
      submit.className = 'btn primary submit';
      if ($<HTMLInputElement>('#autoclear').checked && !first) pad.clear();
      activeInput = m === 'pair' ? px : m === 'table' ? cells[0] : inp;
      if (m !== 'choice' && matchMedia('(hover:hover)').matches) activeInput.focus({ preventScroll: true });
      qwrap.classList.remove('slide-out');
      if (!first && !reduceMotion()) {
        qwrap.classList.add('slide-in');
        setTimeout(() => qwrap.classList.remove('slide-in'), 400);
      }
    };
    if (first || reduceMotion()) return load();
    qwrap.classList.add('slide-out');
    setTimeout(load, 190);
  }

  function updPreview() {
    const p = parseAnswer(inp.value), pv = $('#preview');
    if (p.ok && p.kind === 'frac') {
      const a = p.num!, b = p.den!;
      pv.innerHTML = `${o('=')}${a * b < 0 ? MINUS : ''}${FR(Math.abs(a), Math.abs(b))}`;
      pv.classList.add('on');
    } else pv.classList.remove('on');
  }
  inp.addEventListener('input', () => {
    updPreview();
    field.classList.remove('bad');
  });
  for (const el of [px, py]) el.addEventListener('input', () => pairEl.classList.remove('bad'));

  const msg = (kind: string, html: string) => (fb.innerHTML = `<div class="msg ${kind}">${html}</div>`);
  const escapeHTML = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const FORMAT_HELP = `<span>Enter a number like <b>7</b>, <b>−3</b>, <b>0.25</b> or <b>5/8</b>. That didn’t use a try.</span>`;

  /** Reads the typed answer: whether it's right and how to show it, or null after showing a hint (no try used). */
  function readTyped(): { right: boolean; shown: string } | null {
    if (mode() === 'pair') {
      const rx = px.value.trim(), ry = py.value.trim();
      if (!rx || !ry) {
        (rx ? py : px).focus();
        replayClass(pairEl, 'shake');
        return null;
      }
      const a = parseAnswer(rx), b = parseAnswer(ry);
      if (!a.ok || !b.ok) {
        msg('nudge', FORMAT_HELP);
        return null;
      }
      const [wx, wy] = P!.pair!;
      const right = feq(a.f, wx) && feq(b.f, wy);
      if (right && !(a.simplified && b.simplified)) {
        msg('nudge', `<span>Right values, but simplify them fully first. That didn’t use a try.</span>`);
        return null;
      }
      return { right, shown: escapeHTML(`x = ${clean(rx)}, y = ${clean(ry)}`).replace(/-/g, MINUS) };
    }
    const raw = inp.value.trim();
    if (!raw) {
      inp.focus();
      replayClass(field, 'shake');
      return null;
    }
    const p = parseAnswer(raw);
    if (!p.ok) {
      msg('nudge', p.reason === 'zero' ? `<span>A fraction can’t have 0 on the bottom. That didn’t use a try.</span>` : FORMAT_HELP);
      return null;
    }
    if (feq(p.f, P!.ans) && !p.simplified) {
      msg('nudge', `<span>Right value, but simplify it fully first. That didn’t use a try.</span>`);
      return null;
    }
    return { right: feq(p.f, P!.ans), shown: escapeHTML(clean(raw)).replace(/-/g, MINUS) };
  }

  function lockInputs() {
    for (const el of [inp, px, py, ...cells]) el.disabled = true;
    choicesEl.querySelectorAll<HTMLButtonElement>('.choice').forEach((b) => (b.disabled = true));
    choicesEl.classList.add('done');
  }

  function check() {
    if (!P) return;
    if (phase !== 'ask') return newQ();
    if (mode() === 'choice' || mode() === 'plot') return;
    if (mode() === 'table') {
      const t = readTables();
      if (!t) return;
      if (t.right) return tablesDone();
      return onWrong(t.shown);
    }
    const res = readTyped();
    if (!res) return;
    if (res.right) onRight(answerBox());
    else onWrong(res.shown);
  }

  function onRight(box: HTMLElement) {
    const s = progress();
    phase = 'solved';
    s.total++;
    s.right++;
    S.streak++;
    S.best = Math.max(S.best, S.streak);
    s.best = Math.max(s.best, S.streak);
    const firstTry = attempt === 1;
    const gain = firstTry ? 10 + Math.min(S.streak - 1, 5) * 2 : 5;
    const xpBefore = S.xp;
    S.xp += gain;
    s.xp += gain;
    const unlocks = checkUnlocks(xpBefore, S.xp);
    const before = s.pts;
    s.pts = Math.min(GOAL, s.pts + (firstTry ? 1 : 0.5));
    box.classList.remove('bad');
    box.classList.add('ok');
    lockInputs();
    setPips('ok');
    sfx.win();
    if (reduceMotion()) {
      burstAt(box);
      floatXP(gain, $('#xp'));
    } else if (S.scene && S.scene !== 'tiles')
      playScene(
        S.scene as SceneId,
        firstTry ? pick(['Correct', 'Nailed it', 'Clean', 'Perfect']) : 'Got it',
        `<span>+${gain} XP</span>${S.streak > 1 ? `<span>${S.streak} in a row</span>` : ''}`,
      );
    else bigWin(box, gain, S.streak, firstTry);
    if (unlocks.length) toastUnlock(unlocks);
    msg(
      'good',
      `<div><b>${firstTry ? pick(['Correct.', 'Nailed it.', 'Clean.', 'That’s it.']) : 'Correct on the second try.'}</b> <span class="sub">+${gain} XP${S.streak > 1 ? ` · ${S.streak} in a row` : ''}</span></div><button class="linkbtn" id="seeW">See the working</button>`,
    );
    $('#seeW').onclick = () => {
      fb.innerHTML = '';
      prob.classList.add('solving');
      fb.appendChild(walkthrough(P!, { mode: 'solution', all: true }));
    };
    submit.hidden = false;
    toNext();
    renderStats(true);
    save();
    if (before < GOAL && s.pts >= GOAL && !s.done) {
      s.done = true;
      save();
      setTimeout(showDone, reduceMotion() ? 600 : 1500);
    }
  }

  function onWrong(shownHTML: string, box: HTMLElement = answerBox()) {
    const s = progress();
    sfx.bad();
    replayClass(box, 'shake');
    box.classList.add('bad');
    lastWrong = shownHTML;
    if (attempt === 1) {
      P!.onMiss?.();
      attempt = 2;
      setPips();
      msg(
        'retry',
        mode() === 'choice'
          ? `<span><b>Not that one.</b> One more try.</span>`
          : mode() === 'table'
            ? `<span><b>Some values are off.</b> Fix the red cells. One more try.</span>`
            : `<span><b>Not quite.</b> One more try. Check your signs and your arithmetic.</span>`,
      );
      if (mode() === 'num') inp.select();
      if (mode() === 'pair') px.select();
      if (mode() === 'table') cells.find((c) => c.classList.contains('bad'))?.select();
    } else {
      phase = 'revealed';
      s.total++;
      S.streak = 0;
      // missing a question after both tries costs a point
      const lost = Math.min(1, s.pts);
      s.pts = Math.max(0, s.pts - 1);
      if (lost) floatXP(-lost, $('#scoreTxt'), `−${lost === 1 ? 1 : lost} point`);
      if (P!.table) {
        fillTables();
        plot();
      }
      lockInputs();
      if (mode() === 'choice') choicesEl.querySelector(`[data-i="${P!.correct}"]`)?.classList.add('answer');
      setPips('out');
      fb.innerHTML = '';
      prob.classList.add('solving');
      fb.appendChild(walkthrough(P!, { mode: 'reveal', auto: true, wrongHTML: lastWrong }));
      submit.hidden = false;
      toNext();
      renderStats(true);
      save();
    }
  }

  choicesEl.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('.choice');
    if (!b || b.disabled || !P || phase !== 'ask') return;
    const i = Number(b.dataset.i);
    if (i === P.correct) onRight(b);
    else {
      b.disabled = true;
      onWrong(P.choices![i], b);
    }
  });

  function toNext() {
    submit.textContent = 'Next →';
    submit.className = 'btn go submit';
    submit.focus({ preventScroll: true });
  }

  submit.onclick = check;
  for (const el of [inp, px, py])
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (el === px && !py.value.trim() && phase === 'ask') return py.focus();
      check();
    });
  document.addEventListener('keydown', (e) => {
    if (api.active && e.key === 'Enter' && phase !== 'ask' && !(e.target as Element).matches('textarea,input,button') && overlay.hidden) {
      e.preventDefault();
      newQ();
    }
  });
  $('#skipBtn').onclick = () => newQ();
  $('#exBtn').onclick = () => {
    showTab('ex');
    renderExample();
  };

  /* ---------- keypad ---------- */
  const KEYS = ['7', '8', '9', '4', '5', '6', '⌫', 'Clear', '1', '2', '3', '0', '.', '−', '/', 'Enter'];
  const keypad = $('#keypad');
  keypad.innerHTML = KEYS.map(
    (k) => `<button class="${k === 'Enter' ? 'ent' : /[⌫a-z]/.test(k) ? 'fn' : ''}" data-k="${k}">${k === '/' ? 'a/b' : k}</button>`,
  ).join('');
  keypad.addEventListener('click', (e) => {
    const k = (e.target as Element).closest<HTMLElement>('button')?.dataset.k;
    const el = activeInput;
    if (!k || (el.disabled && k !== 'Enter')) return;
    sfx.tap();
    if (k === 'Enter') return check();
    if (k === 'Clear') el.value = '';
    else if (k === '⌫') el.value = el.value.slice(0, -1);
    else el.value += k === '−' ? '-' : k;
    el.dispatchEvent(new Event('input'));
  });
  $('#kbtn').onclick = (e) => {
    const show = keypad.hidden;
    keypad.hidden = !show;
    (e.currentTarget as HTMLElement).setAttribute('aria-pressed', String(show));
  };

  addEventListener('stepwise:xp', (e) => {
    progress().xp += (e as CustomEvent<number>).detail;
    renderStats(true);
    save();
  });

  /* ---------- tools tabs ---------- */
  function showTab(id: string) {
    $$('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
    for (const k of ['note', 'graph', 'ex']) $('#pane-' + k).hidden = k !== id;
    if (id === 'note') pad.resize();
    if (id === 'graph') graph.resize();
  }
  /* minimise the tools panel (remembered) */
  const work = $('.work');
  const minBtn = $('#toolsMin');
  function setToolsMin(min: boolean) {
    S.toolsMin = min;
    work.classList.toggle('min', min);
    minBtn.title = min ? 'Show panel' : 'Minimise panel';
    minBtn.setAttribute('aria-label', minBtn.title);
    minBtn.setAttribute('aria-expanded', String(!min));
    save();
    requestAnimationFrame(() => {
      pad.resize();
      graph.resize();
    });
  }
  setToolsMin(!!S.toolsMin);
  minBtn.onclick = () => setToolsMin(!S.toolsMin);
  $$('.tab').forEach(
    (t) =>
      (t.onclick = () => {
        if (S.toolsMin) setToolsMin(false);
        showTab(t.dataset.tab!);
        if (t.dataset.tab === 'ex') renderExample();
      }),
  );
  function renderExample() {
    const t = topic(), e = t.gen(), ex = $('#ex');
    ex.innerHTML = `<div class="ex-q"><div class="qm">${e.table ? e.sample : e.q}</div><div class="inx"><span class="eyebrow">Example</span><br>${e.inst}</div><button class="btn ghost sm" id="anotherEx">New example</button></div>`;
    ex.appendChild(walkthrough(e, { mode: 'example' }));
    $('#anotherEx').onclick = renderExample;
  }

  /* ---------- sound + navigation ---------- */
  const soundBtn = $('#soundBtn');
  const showSound = () => {
    soundBtn.innerHTML = S.sound ? SPEAKER_ON : SPEAKER_OFF;
    soundBtn.title = S.sound ? 'Sound on' : 'Sound off';
  };
  showSound();
  soundBtn.onclick = () => {
    S.sound = !S.sound;
    showSound();
    save();
    sfx.tap();
  };
  $('#back').onclick = () => go('lessons');

  /* ---------- lesson mastered ---------- */
  function showDone() {
    const s = progress();
    $('#doneTitle').textContent = topicName(topic());
    $('#dAcc').textContent = Math.round((s.right / s.total) * 100) + '%';
    $('#dStreak').textContent = String(s.best);
    $('#dXp').textContent = String(s.xp);
    overlay.hidden = false;
    sfx.done();
    confettiRain();
    $('#nextTopic').focus();
  }
  $('#keepGoing').onclick = () => {
    overlay.hidden = true;
    newQ();
  };
  $('#toMenu').onclick = () => {
    overlay.hidden = true;
    go('lessons');
  };
  $('#nextTopic').onclick = () => {
    overlay.hidden = true;
    const i = TOPICS.findIndex((t) => t.id === S.topic);
    go(TOPICS[(i + 1) % TOPICS.length].id);
  };

  function open(id: string) {
    S.topic = id;
    progress(id).seen = true;
    save();
    qnum = 0;
    P = null;
    renderHead();
    newQ(true);
    renderExample();
    requestAnimationFrame(() => {
      pad.resize();
      graph.resize();
    });
  }

  return api;
}
