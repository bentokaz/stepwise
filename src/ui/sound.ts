/** Short synthesized sound effects (no audio files). Browsers only allow sound after a click or key press. */
import { S } from '../state';

let ac: AudioContext | undefined;

function tone(freqs: number[], dur = 0.11, type: OscillatorType = 'sine', vol = 0.07): void {
  if (!S.sound) return;
  try {
    ac ??= new AudioContext();
    const t0 = ac.currentTime;
    freqs.forEach((f, i) => {
      const os = ac!.createOscillator(), g = ac!.createGain(), t = t0 + i * dur * 0.75;
      os.type = type;
      os.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.8);
      os.connect(g).connect(ac!.destination);
      os.start(t);
      os.stop(t + dur * 2);
    });
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  win: () => {
    tone([523, 784, 1047, 1568], 0.07, 'triangle', 0.07);
    setTimeout(() => tone([2093], 0.05, 'sine', 0.03), 380);
  },
  bad: () => tone([196, 147], 0.1, 'square', 0.025),
  done: () => tone([523, 659, 784, 1047, 1319], 0.09, 'triangle', 0.07),
  tap: () => tone([1400], 0.02, 'sine', 0.02),
  step: () => tone([988], 0.05, 'triangle', 0.035),
};

export const SPEAKER_ON =
  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h3l4-3v10l-4-3H3z"/><path d="M12.5 6.5a3.5 3.5 0 010 5M14.5 4.5a6.4 6.4 0 010 9"/></svg>';
export const SPEAKER_OFF =
  '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h3l4-3v10l-4-3H3z"/><path d="M12.5 7l4 4M16.5 7l-4 4"/></svg>';
