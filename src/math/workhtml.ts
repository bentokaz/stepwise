/** Builds the HTML for lines of working (shared by the walkthrough and "explain the step" questions). */
import type { Step } from './topics';

export interface WorkOptions {
  /** Last step index to show. */
  shown: number;
  /** Steps from this index on get the fade-in class. */
  newFrom: number;
  /** Replace this step's explanation with a "?". */
  hideWhyAt?: number;
  /** Highlight this step's lines. */
  highlight?: number;
  /** Mark the final step as the answer. */
  finished?: boolean;
}

export function stepsHTML(work: Step[], { shown, newFrom, hideWhyAt, highlight, finished }: WorkOptions): string {
  const total = work.length - 1;
  let h = '';
  work.forEach((st, i) => {
    if (i > shown) return;
    const cls = `${i >= newFrom ? ' nw' : ''}${i === highlight ? ' hl' : ''}${finished && i === total ? ' fin' : ''}`;
    if (i > 0) {
      const why = i === hideWhyAt ? '<em class="qmark">?</em>' : (st.why ?? '');
      h += `<div class="why${cls}${i === shown ? ' cur' : ''}"><b>${i}</b><span>${why}</span></div>`;
      if (st.op) h += `<div class="l op${cls}"><span>${st.op}</span></div><div class="op${cls}"></div><div class="r op${cls}"><span>${st.op}</span></div>`;
    }
    const rows = st.rows ?? (st.l !== '' || st.r !== '' ? [{ l: st.l, r: st.r }] : []);
    for (const r of rows) {
      h += `<div class="l${cls}">${r.l}</div><div class="e${cls}">${r.r !== '' && r.l !== '' ? '=' : r.r !== '' && i > 0 ? '=' : ''}</div><div class="r${cls}">${r.r}${r.tag ? `<span class="tag">${r.tag}</span>` : ''}</div>`;
    }
    if (st.full) h += `<div class="full${cls}">${st.full}</div>`;
  });
  return h;
}
