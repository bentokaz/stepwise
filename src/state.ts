/** Progress saved in this browser's localStorage. */
import { TOPICS } from './math/topics';

export interface TopicProgress {
  pts: number;
  right: number;
  total: number;
  xp: number;
  best: number;
  done: boolean;
  seen: boolean;
}

export interface SaveData {
  topic: string;
  xp: number;
  streak: number;
  best: number;
  sound: boolean;
  /** Success screen id ('tiles', 'shockwave', …). */
  screen?: string;
  /** Rewards unlocked but not yet seen in the Rewards dialog. */
  newRewards?: string[];
  /** Accent colour id. */
  accent?: string;
  /** Notes/Graph/Examples panel minimised. */
  toolsMin?: boolean;
  t: Record<string, TopicProgress>;
}

const KEY = 'stepwise-v1';

const fresh = (): TopicProgress => ({ pts: 0, right: 0, total: 0, xp: 0, best: 0, done: false, seen: false });

function load(): SaveData {
  const base: SaveData = { topic: TOPICS[0].id, xp: 0, streak: 0, best: 0, sound: true, t: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<SaveData>;
      if (s && typeof s === 'object' && s.t) Object.assign(base, s);
    }
  } catch {
    /* private mode or corrupt data: start fresh */
  }
  for (const t of TOPICS) base.t[t.id] = { ...fresh(), ...base.t[t.id] };
  if (!TOPICS.some((t) => t.id === base.topic)) base.topic = TOPICS[0].id;
  base.accent ??= 'lime';
  return base;
}

export const S: SaveData = load();

export function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {
    /* storage full or blocked */
  }
}

export const progress = (id = S.topic): TopicProgress => S.t[id];
