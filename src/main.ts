import { findTopic } from './math/topics';
import { S } from './state';
import { $ } from './ui/dom';
import { initGraph } from './ui/graph';
import { initMenu, renderMenu } from './ui/menu';
import { initNotepad } from './ui/notepad';
import { initPractice } from './ui/practice';

/* Routing on the URL hash: #lessons (or nothing) is the menu, #<lesson id> is practice. */
type View = 'menu' | 'practice';
let view: View | '' = '';
const menuEl = $('#menu');
const practiceEl = $('#practice');

function show(el: HTMLElement, other: HTMLElement) {
  other.hidden = true;
  el.hidden = false;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}

function route() {
  const id = location.hash.slice(1);
  const t = findTopic(id);
  if (t) {
    if (view === 'practice' && S.topic === id) return;
    view = 'practice';
    practice.active = true;
    show(practiceEl, menuEl);
    practice.open(id);
  } else {
    if (view === 'menu') return;
    view = 'menu';
    practice.active = false;
    renderMenu();
    show(menuEl, practiceEl);
  }
}

function go(hash: string) {
  if (location.hash.slice(1) !== hash) location.hash = hash; // fires hashchange → route()
  else route();
}

const pad = initNotepad();
const graph = initGraph();
const practice = initPractice(go, pad, graph);
initMenu(go);

const redrawCanvases = () => {
  pad.redraw();
  graph.draw();
};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawCanvases);

addEventListener('hashchange', route);
route();
