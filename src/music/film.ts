/**
 * Music in film (MYP 3, Criterion A: Film Soundtracking) test prep.
 * Multiple-choice lessons built from the class study guide's content, written in our own words.
 * Each lesson deals its questions from a shuffled deck so nothing repeats until the deck is used up,
 * and a missed question comes back a few questions later.
 */
import { F } from '../math/core';
import type { Problem, Topic } from '../math/topics';

const GROUP = 'Music in Film test prep';

/** One question: the right answer, a pool of wrong answers (3 are picked), and the explanation. */
export interface Item {
  q: string;
  a: string;
  wrong: string[];
  why: string;
  /** Keep the options in this order (for ordering questions and "which part" questions). */
  fixed?: boolean;
}

const shuffle = <T>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const q = (s: string) => `<b>${s}</b>`;
const say = (s: string) => `<span class="quote">“${s}”</span>`;

/* ---------------- source facts ---------------- */

interface Term {
  t: string;
  d: string;
  kind: 'technique' | 'element' | 'word';
}
const TERMS: Term[] = [
  { t: 'Leitmotif', kind: 'technique', d: 'A recurring musical theme linked to a specific character, place or idea, which returns and often develops across the film' },
  { t: 'Hit point', kind: 'technique', d: 'The exact moment the music is timed to line up with physical action on screen, almost like a sound effect' },
  { t: 'Ostinato', kind: 'technique', d: 'A short musical pattern repeated persistently, often to build tension or drive momentum' },
  { t: 'Pedal tone (drone)', kind: 'technique', d: 'A sustained or repeated note, often low, held underneath changing harmony to create unease or suspense' },
  { t: 'Timbre / instrumentation', kind: 'element', d: 'The choice of instruments and their tone colour, which shapes the mood and the cultural setting' },
  { t: 'Tempo', kind: 'element', d: 'The speed of the music' },
  { t: 'Dynamics', kind: 'element', d: 'How loud or quiet the music is, and how that changes' },
  { t: 'Harmony', kind: 'element', d: 'The chords underneath a melody, and whether they sound stable or unstable' },
  { t: 'Texture', kind: 'element', d: 'How many layers of sound there are and how they combine' },
  { t: 'Pitch / register', kind: 'element', d: 'How high or low the notes are' },
  { t: 'Articulation', kind: 'element', d: 'How the notes are played: smoothly connected, or short and detached' },
  { t: 'Legato', kind: 'word', d: 'Smooth, connected notes' },
  { t: 'Staccato', kind: 'word', d: 'Short, detached notes' },
  { t: 'Crescendo', kind: 'word', d: 'Gradually getting louder' },
  { t: 'Dissonant', kind: 'word', d: 'Clashing chords that sound unstable and tense' },
  { t: 'Consonant', kind: 'word', d: 'Stable, pleasant-sounding chords that feel settled' },
  { t: 'Sting', kind: 'word', d: 'A short, sudden, loud musical hit used to shock' },
  { t: 'Tremolo', kind: 'word', d: 'A very fast, trembling repetition of a note (often on strings) that builds tension' },
];

/** [element, choice that builds tension/suspense, choice that builds warmth/joy] */
const MOOD: [string, string, string][] = [
  ['Tempo', 'Slow and unpredictable, or gradually speeding up', 'Moderate to fast, steady and dance-like'],
  ['Dynamics', 'Very quiet, then sudden loud stings', 'Full and warm, gradually swelling'],
  ['Instrumentation', 'Low strings, tremolo and unusual, dissonant timbres', 'String and woodwind melodies, full orchestra, familiar sounds'],
  ['Harmony', 'Dissonant, minor, unresolved chords', 'Consonant, major key, resolved cadences'],
  ['Texture', 'Sparse isolated lines, or dense and chaotic layers', 'Rich, layered and balanced'],
  ['Pitch / register', 'Very high (fragile, shrill) or very low (menacing)', 'Comfortable mid-range, singable melodies'],
  ['Articulation', 'Short, detached (staccato), jagged rhythms', 'Smooth, connected (legato) lines'],
];

const FUNCS = {
  sig: 'Signalling a character or place (leitmotif)',
  mood: 'Setting the mood or atmosphere',
  tension: 'Building or releasing tension',
  fore: 'Foreshadowing events before they happen',
  setting: 'Establishing setting, time period or culture',
  guide: 'Guiding the audience’s emotions, even against the visuals',
};
const FUNC_LIST = Object.values(FUNCS);

interface Film {
  film: string;
  year: number;
  who: string;
  did: string;
  matters: string;
}
const FILMS: Film[] = [
  {
    film: 'The Jazz Singer',
    year: 1927,
    who: '',
    did: 'The first major “talkie”, with synchronised dialogue and music',
    matters: 'Film music moved from live accompanists in the cinema to recorded, synchronised scores packaged with the film',
  },
  {
    film: 'King Kong',
    year: 1933,
    who: 'Max Steiner',
    did: 'Created the lush, symphonic “Hollywood sound”, using leitmotifs inspired by 19th-century opera composers such as Wagner',
    matters: 'It set the template for orchestral scoring and leitmotifs that composers still use today',
  },
  {
    film: 'Psycho',
    year: 1960,
    who: 'Bernard Herrmann',
    did: 'Used shrieking, dissonant strings instead of a conventional melody',
    matters: 'It showed film music could be deliberately unsettling and abstract, not just beautiful',
  },
  {
    film: 'Jaws',
    year: 1975,
    who: 'John Williams',
    did: 'Revived the full orchestra with bold leitmotifs and ostinato',
    matters: 'It brought large orchestral scores back after a period dominated by pop and rock soundtracks',
  },
  {
    film: 'Star Wars',
    year: 1977,
    who: 'John Williams',
    did: 'Revived the full orchestra with bold leitmotifs and ostinato',
    matters: 'It brought large orchestral scores back after a period dominated by pop and rock soundtracks',
  },
  {
    film: 'Blade Runner',
    year: 1982,
    who: 'Vangelis',
    did: 'Was scored almost entirely with synthesizers',
    matters: 'It proved electronic instruments could create entirely new textures and moods, not just imitate an orchestra',
  },
  {
    film: 'Inception',
    year: 2010,
    who: 'Hans Zimmer',
    did: 'Blended orchestral music with electronic and digital sound design (hybrid scoring)',
    matters: 'It reflects the modern trend of combining traditional and digital tools in the same score',
  },
];

/* ---------------- lesson 1: vocabulary ---------------- */

const SCENES: [string, string][] = [
  ['The same short theme plays every time Hedwig the owl appears in Harry Potter.', 'Leitmotif'],
  ['Darth Vader’s theme plays whenever he enters a scene.', 'Leitmotif'],
  ['A melody linked to a lost city returns every time the city is mentioned, and gets grander when the heroes finally find it.', 'Leitmotif'],
  ['A cymbal crashes at the exact moment a character falls to the floor.', 'Hit point'],
  ['A rising scale plays as a character climbs a staircase, matching each step.', 'Hit point'],
  ['A loud brass chord lands exactly as a door slams shut.', 'Hit point'],
  ['The two-note pattern in Jaws repeats again and again as the shark gets closer.', 'Ostinato'],
  ['A short four-note rhythm repeats over and over under a car chase, driving it forward.', 'Ostinato'],
  ['A low cello note is held underneath a tense conversation while the chords above it change.', 'Pedal tone (drone)'],
  ['One deep note rumbles on and on under a scene while the harmony above it shifts.', 'Pedal tone (drone)'],
  ['The scene is almost silent, then a sudden, very loud orchestral hit makes the audience jump.', 'Sting'],
  ['The music gets louder and louder as the hero sprints towards the finish line.', 'Crescendo'],
  ['Violins play one note extremely fast, trembling, as a character walks through a dark forest.', 'Tremolo'],
  ['Smooth, connected violin lines play during a tender goodbye.', 'Legato'],
  ['Short, detached brass notes punch out during a race against time.', 'Staccato'],
];

const termsOf = (kinds: Term['kind'][]) => TERMS.filter((t) => kinds.includes(t.kind));

const VOCAB: Item[] = [
  ...TERMS.map((t) => ({
    q: `What does ${q(t.t.toLowerCase().replace('timbre / instrumentation', 'timbre (instrumentation)'))} mean?`,
    a: t.d,
    wrong: TERMS.filter((o) => o !== t && (o.kind === t.kind || t.kind === 'word')).map((o) => o.d),
    why: `${t.t}: ${t.d.charAt(0).toLowerCase() + t.d.slice(1)}.`,
  })),
  ...TERMS.map((t) => ({
    q: `Which word means: ${say(t.d)}?`,
    a: t.t,
    wrong: TERMS.filter((o) => o !== t && (o.kind === t.kind || o.kind !== 'element')).map((o) => o.t),
    why: `${t.t} means ${t.d.charAt(0).toLowerCase() + t.d.slice(1)}.`,
  })),
  ...SCENES.map(([scene, term]) => ({
    q: `${scene}<br><span class="sub">What is this technique called?</span>`,
    a: term,
    wrong: [...termsOf(['technique']).map((t) => t.t), 'Crescendo', 'Sting', 'Legato', 'Staccato', 'Tremolo'].filter((t) => t !== term),
    why: `${term}: ${TERMS.find((t) => t.t === term)!.d.charAt(0).toLowerCase() + TERMS.find((t) => t.t === term)!.d.slice(1)}.`,
  })),
  {
    q: `What is the difference between an ${q('ostinato')} and a ${q('pedal tone')}?`,
    a: 'An ostinato repeats a short pattern; a pedal tone holds or repeats one note under changing chords',
    wrong: [
      'They are two names for the same thing',
      'An ostinato is always loud; a pedal tone is always quiet',
      'An ostinato is sung; a pedal tone is played on instruments',
    ],
    why: 'Ostinato = a short repeated pattern (the two notes in Jaws). Pedal tone/drone = one sustained or repeated note, often low, under changing harmony.',
  },
  {
    q: `A hero’s theme first plays boldly in a major key. At the end of the film it returns slowly and quietly in a minor key after the hero loses. What does this show?`,
    a: 'The leitmotif has been developed to match a change in the story',
    wrong: ['The composer ran out of new ideas', 'The theme has turned into a hit point', 'The film has switched to a new character'],
    why: 'A leitmotif returns and often develops. Changing its tempo, dynamics or key (major → minor) shows how the character’s situation has changed.',
  },
];

/* ---------------- lesson 2: creating mood ---------------- */

const MOOD_ITEMS: Item[] = [
  ...MOOD.map(([el, tense, warm]) => ({
    q: `A composer wants to build ${q('tension or suspense')}. Which ${el.toLowerCase()} choice fits?`,
    a: tense,
    wrong: [warm],
    why: `${el} for tension: ${tense.toLowerCase()}. For warmth or joy it would be ${warm.toLowerCase()}.`,
  })),
  ...MOOD.map(([el, tense, warm]) => ({
    q: `A composer wants a scene to feel ${q('warm and joyful')}. Which ${el.toLowerCase()} choice fits?`,
    a: warm,
    wrong: [tense],
    why: `${el} for warmth or joy: ${warm.toLowerCase()}. For tension it would be ${tense.toLowerCase()}.`,
  })),
  ...MOOD.map(([el, tense]) => ({
    q: `Which choice would build ${q('tension or suspense')}?`,
    a: tense,
    wrong: MOOD.map((m) => m[2]),
    why: `${tense} (${el.toLowerCase()}) builds tension. The other options all build warmth or joy.`,
  })),
  ...MOOD.map(([el, , warm]) => ({
    q: `Which choice would build ${q('warmth or joy')}?`,
    a: warm,
    wrong: MOOD.map((m) => m[1]),
    why: `${warm} (${el.toLowerCase()}) builds warmth. The other options all build tension.`,
  })),
  ...MOOD.flatMap(([el, tense, warm]) =>
    [tense, warm].map((choice) => ({
      q: `${say(choice)}<br><span class="sub">Which musical element is this choice about?</span>`,
      a: el,
      wrong: MOOD.map((m) => m[0]).filter((e) => e !== el),
      why: `${choice} is a ${el.toLowerCase()} choice.`,
    })),
  ),
  {
    q: `A composer wants a character to sound ${q('fragile and small')}. Which register fits best?`,
    a: 'A very high register',
    wrong: ['A very low register', 'A comfortable mid-range', 'It makes no difference'],
    why: 'A very high register sounds fragile or shrill. A very low register sounds menacing.',
  },
  {
    q: `A composer wants a monster to feel ${q('menacing and full of doom')}. Which register fits best?`,
    a: 'A very low register',
    wrong: ['A very high register', 'A comfortable mid-range', 'It makes no difference'],
    why: 'A very low register sounds menacing or doom-filled. A high register sounds fragile.',
  },
  {
    q: `A director wants a scene to feel ${q('intimate and personal')}. Which instrumentation fits best?`,
    a: 'Solo strings',
    wrong: ['A full brass section', 'Heavy drums', 'An out of tune guitar'],
    why: 'Timbre shapes mood: solo strings for intimacy, brass for heroism, an out of tune guitar for unease.',
  },
  {
    q: `Which pairing of instrument and effect is most appropriate?`,
    a: 'Brass for heroism',
    wrong: ['Brass for intimacy', 'Solo strings for loud heroism', 'Out of tune guitar for warmth'],
    why: 'Solo strings → intimacy. Brass → heroism. Out of tune guitar → unease.',
  },
  {
    q: `A scene should feel ${q('slightly wrong and uneasy')}. Which instrument choice fits?`,
    a: 'An out of tune guitar',
    wrong: ['A warm full orchestra', 'Bold brass fanfare', 'Smooth woodwind melody'],
    why: 'An out of tune guitar creates unease. Familiar, warm timbres create comfort.',
  },
  {
    q: `Which articulation best suits a ${q('tender goodbye')}?`,
    a: 'Legato strings',
    wrong: ['Staccato brass', 'Sudden loud stings', 'Jagged, detached rhythms'],
    why: 'Legato (smooth and connected) suits tenderness. Staccato (short and detached) suits urgency.',
  },
  {
    q: `Which articulation best suits ${q('urgency and a jagged, tense feeling')}?`,
    a: 'Staccato brass',
    wrong: ['Legato strings', 'A sustained pedal tone', 'A gradual crescendo'],
    why: 'Staccato notes are short and detached, which suits urgency. Legato suits tenderness.',
  },
  {
    q: `A scene shows a ${q('crowd in panic')}. Which texture fits best?`,
    a: 'A dense layer of clashing, mismatched instruments',
    wrong: ['One quiet solo flute', 'Smooth, balanced strings in harmony', 'A single sparse melody line'],
    why: 'A dense, chaotic texture builds panic and tension. A rich but balanced texture feels warm.',
  },
  {
    q: `A scene uses ${q('one quiet, sparse melody line')} and nothing else. How would you describe the texture?`,
    a: 'Thin and isolated, which can suggest loneliness or tension',
    wrong: ['Thick and layered, which suggests joy', 'Fast, which suggests a chase', 'Loud, which suggests heroism'],
    why: 'Texture is how many layers there are. One sparse line is thin and isolated: loneliness or tension.',
  },
  {
    q: `During a chase, the music ${q('gets faster and faster')}. What effect does this tempo choice have?`,
    a: 'It builds urgency and tension',
    wrong: ['It makes the scene feel calm', 'It shows the film is about to end', 'It shows the scene is a flashback'],
    why: 'A tempo that gradually speeds up builds urgency and tension.',
  },
  {
    q: `The scene is almost silent, then a ${q('sudden, very loud sting')} plays. Which element is the composer using to shock?`,
    a: 'Dynamics',
    wrong: ['Texture', 'Harmony', 'Pitch'],
    why: 'Dynamics = how loud or quiet. Very quiet music builds unease; a sudden loud sting shocks.',
  },
  {
    q: `After a long chase, the music settles on a ${q('calm, consonant major chord')}. What is the music doing?`,
    a: 'Releasing tension',
    wrong: ['Building tension', 'Introducing a new leitmotif', 'Foreshadowing danger'],
    why: 'Music can release tension as well as build it. A resolved, consonant chord gives a sense of relief.',
  },
  {
    q: `A scene ends on a ${q('resolved, stable chord')}. How does this usually make the audience feel?`,
    a: 'Settled and at ease, as if the tension is over',
    wrong: ['More anxious than before', 'Confused about where the scene is set', 'Ready for a jump scare'],
    why: 'Consonant, major, resolved harmony sounds stable and warm, so it releases tension.',
  },
  {
    q: `The music ${q('suddenly stops')} just before a character opens a door. Why?`,
    a: 'To build suspense',
    wrong: ['To show the film is ending', 'To introduce a new leitmotif', 'To show a change of setting'],
    why: 'When music starts and stops is a musical choice. Silence builds suspense and makes the next sound hit harder.',
  },
  {
    q: `Which set of choices best suits a ${q('warm, joyful family scene')}?`,
    a: 'Consonant major chords, legato lines, rich layered texture',
    wrong: [
      'Dissonant chords, staccato notes, sparse texture',
      'A very low drone, slow tempo, unresolved chords',
      'Tremolo strings, jagged rhythms, sudden loud stings',
    ],
    why: 'Warmth comes from consonant, major, resolved harmony, smooth legato lines and a rich, balanced texture.',
  },
  {
    q: `Which set of choices best suits a ${q('horror scene where danger is creeping closer')}?`,
    a: 'Low tremolo strings, dissonant chords, very quiet then sudden stings',
    wrong: [
      'Consonant major chords, legato lines, rich layered texture',
      'A steady dance-like tempo and a singable mid-range melody',
      'Full, warm dynamics that gradually swell',
    ],
    why: 'Tension comes from low or unusual timbres like tremolo, dissonant unresolved harmony, and very quiet dynamics with sudden stings.',
  },
  {
    q: `Which harmony choice would build ${q('danger and tension')}?`,
    a: 'Dissonant, unresolved chords',
    wrong: ['Consonant, major, resolved chords', 'A steady dance rhythm', 'A smooth legato melody'],
    why: 'Dissonant, minor, unresolved chords sound unstable. Consonant, major, resolved chords sound stable and warm.',
  },
  {
    q: `Which tempo best suits a scene of ${q('grief')}?`,
    a: 'A slow tempo',
    wrong: ['A fast, dance-like tempo', 'A tempo that keeps speeding up', 'A bouncy, steady march'],
    why: 'Tempo = speed. A slow tempo suits grief; a fast tempo suits a chase.',
  },
];

/* ---------------- lesson 3: functions ---------------- */

const FUNC_SCENES: [string, string, string][] = [
  ['A film set in feudal Japan uses shakuhachi flute and taiko drums.', FUNCS.setting, 'The instruments place us in a specific culture and time before anyone speaks.'],
  ['Bagpipes play as the camera sweeps over the Scottish Highlands.', FUNCS.setting, 'The instrument tells us where we are.'],
  ['A 1920s jazz band plays over a party scene in an old-fashioned city.', FUNCS.setting, 'The style of music tells us the time period.'],
  ['A happy family picnic, but a low, rumbling drone slowly grows underneath.', FUNCS.fore, 'The music hints that something bad is coming before we see it.'],
  ['A few ominous minor chords creep into a wedding scene, just before a storm destroys the party.', FUNCS.fore, 'The music warns the audience before the event happens on screen.'],
  ['The same theme plays every time the hero appears.', FUNCS.sig, 'A recurring theme for a character is a leitmotif.'],
  ['A theme linked to a hidden kingdom plays every time the kingdom is mentioned.', FUNCS.sig, 'A recurring theme can stand for a place, not just a person.'],
  ['Cheerful, bouncy music plays over a frightening scene, and it feels even more disturbing.', FUNCS.guide, 'The music shapes how we feel, even against what we see.'],
  ['Slow, sad music plays while a character smiles, so we sense they are hiding their pain.', FUNCS.guide, 'The music tells us something the picture does not.'],
  ['Soft, misty synth chords open a film in a quiet, dreamlike forest.', FUNCS.mood, 'The music creates the atmosphere of the scene.'],
  ['Gentle sustained strings make a foggy harbour at dawn feel calm and peaceful.', FUNCS.mood, 'The music sets the mood of the scene.'],
  ['The music gets faster and louder as a bomb timer counts down.', FUNCS.tension, 'Speeding up and getting louder builds tension.'],
  ['A long chase ends and the music finally resolves onto a calm major chord.', FUNCS.tension, 'A resolved chord releases the tension.'],
];

const FUNC_ITEMS: Item[] = [
  ...FUNC_SCENES.map(([scene, f, why]) => ({
    q: `${scene}<br><span class="sub">What is the music mainly doing?</span>`,
    a: f,
    wrong: FUNC_LIST.filter((o) => o !== f),
    why,
  })),
  {
    q: `Which of these is ${q('not')} a function of a film soundtrack?`,
    a: 'Telling the audience the names of the actors',
    wrong: FUNC_LIST,
    why: 'The six functions: leitmotif (signal a character/place), set the mood, build or release tension, foreshadow, establish setting/time/culture, and guide the audience’s emotions.',
  },
  {
    q: `Every musical choice in a film (tempo, dynamics, instruments, harmony, when the music starts and stops) is designed to…`,
    a: 'Shape how the audience feels and what they understand about the story',
    wrong: [
      'Fill silence so the audience doesn’t get bored',
      'Show off how skilled the composer is',
      'Make the film longer',
      'Copy whatever is happening on screen exactly',
    ],
    why: 'Film music is never just decoration. Every choice shapes how the audience feels and what they understand, without a word being spoken.',
  },
  {
    q: `A soundtrack can guide the audience’s emotions ${q('even against what is shown on screen')}. Which example shows this?`,
    a: 'Cheerful music over a frightening scene makes it feel even more disturbing',
    wrong: [
      'Scary music plays over a scary scene',
      'A cymbal crash lines up with a character falling',
      'Bagpipes play over the Scottish Highlands',
    ],
    why: 'When music and picture disagree, the music can change how we feel about what we see.',
  },
];

/* ---------------- lesson 4: history ---------------- */

const withWho = FILMS.filter((f) => f.who);
const yearsWrong = (y: number) => shuffle([1927, 1933, 1960, 1975, 1977, 1982, 2010, 1950, 1995, 1940].filter((o) => o !== y));
const HIST_ITEMS: Item[] = [
  ...withWho.map((f) => ({
    q: `Who composed the score for ${q(f.film)} (${f.year})?`,
    a: f.who,
    wrong: [...new Set(withWho.map((o) => o.who))].filter((w) => w !== f.who),
    why: `${f.film} (${f.year}): ${f.who}. ${f.did}.`,
  })),
  ...withWho
    .filter((f) => f.film !== 'Star Wars')
    .map((f) => ({
      q: `What is ${q(f.who)} known for in film music history?`,
      a: `${f.did} (${f.film})`,
      wrong: withWho.filter((o) => o.who !== f.who).map((o) => `${o.did} (${f.film})`),
      why: `${f.who}, ${f.film} (${f.year}): ${f.did.charAt(0).toLowerCase() + f.did.slice(1)}. ${f.matters}.`,
    })),
  ...FILMS.filter((f) => f.film !== 'Star Wars').map((f) => ({
    q: `Why does ${q(f.film)} (${f.year}) matter in the history of film music?`,
    a: f.matters,
    wrong: FILMS.filter((o) => o.matters !== f.matters).map((o) => o.matters),
    why: `${f.film}${f.who ? ` (${f.who})` : ''}: ${f.did.charAt(0).toLowerCase() + f.did.slice(1)}.`,
  })),
  ...FILMS.map((f) => ({
    q: `In what year was ${q(f.film)} released?`,
    a: String(f.year),
    wrong: yearsWrong(f.year).map(String),
    why: `${f.film}: ${f.year}. Timeline: The Jazz Singer 1927 → King Kong 1933 → Psycho 1960 → Jaws 1975 → Star Wars 1977 → Blade Runner 1982 → Inception 2010.`,
  })),
  {
    q: `Before recorded sound (the ${q('silent film era, 1895–1927')}), how did cinemas provide music?`,
    a: 'Live pianists or organists improvised to match the action',
    wrong: ['Pre-recorded orchestras on discs', 'Sound effects only, no music', 'Singers performed all the dialogue'],
    why: 'In the silent era, live pianists or organists improvised. Music was already essential to storytelling before recorded sound.',
  },
  {
    q: `What does ${q('hybrid scoring')} mean (for example Hans Zimmer’s Inception, 2010)?`,
    a: 'Blending orchestral music with electronic and digital sound design',
    wrong: ['Using only two instruments in a score', 'Mixing silent film and sound film techniques', 'Writing music for two films at once'],
    why: 'Hybrid scoring (2000s to today) combines traditional orchestral and digital tools in the same score.',
  },
  {
    q: `Max Steiner’s leitmotifs in King Kong (1933) were inspired by…`,
    a: '19th-century opera composers such as Wagner',
    wrong: ['Jazz bands', '1970s rock soundtracks', 'Synthesizer music'],
    why: 'Steiner drew on opera composers like Wagner to create the lush, symphonic “Hollywood sound” of the 1930s Golden Age.',
  },
  {
    q: `When John Williams revived the full orchestra in the 1970s, what had been dominating film soundtracks before?`,
    a: 'Pop, rock and experimental music',
    wrong: ['Live organists in the cinema', 'Silent film accompaniment', 'Only synthesizers'],
    why: 'Williams (Jaws 1975, Star Wars 1977) brought big orchestral scores back after a period dominated by pop and rock.',
  },
  {
    q: `A friend says synthesizers can only make cheap copies of an orchestra. Which film proves them wrong?`,
    a: 'Blade Runner (1982), scored by Vangelis',
    wrong: ['The Jazz Singer (1927)', 'King Kong (1933)', 'Jaws (1975)'],
    why: 'Vangelis scored Blade Runner almost entirely with synthesizers, creating new textures and moods.',
  },
  {
    q: `Which film was the first major ${q('“talkie”')}, with synchronised dialogue and music?`,
    a: 'The Jazz Singer (1927)',
    wrong: ['King Kong (1933)', 'Psycho (1960)', 'Blade Runner (1982)'],
    why: 'The Jazz Singer (1927) marked the shift from live accompanists to recorded, synchronised scores.',
  },
  {
    q: `Which era is known as the ${q('Golden Age')} of Hollywood film scoring?`,
    a: 'The 1930s',
    wrong: ['The silent era (1895–1927)', 'The 1970s', 'The 2000s'],
    why: 'The 1930s Golden Age: Max Steiner (King Kong, 1933) set up the symphonic Hollywood sound.',
  },
];

/** "Which order, earliest first?" with four films; the wrong options are other orders. */
function orderItem(): Item {
  const films = shuffle(FILMS.filter((f) => f.film !== 'Star Wars')).slice(0, 4);
  const right = [...films].sort((a, b) => a.year - b.year);
  const name = (fs: Film[]) => fs.map((f) => f.film).join(' → ');
  const wrong = new Set<string>();
  while (wrong.size < 3) {
    const s = shuffle(films);
    if (name(s) !== name(right)) wrong.add(name(s));
  }
  return {
    q: `Put these films in order, ${q('earliest first')}.`,
    a: name(right),
    wrong: [...wrong],
    why: right.map((f) => `${f.film} (${f.year})`).join(', ') + '.',
  };
}

/** "Which came first?" between two milestones. */
function firstItem(): Item {
  const [a, b] = shuffle(FILMS.filter((f) => f.film !== 'Star Wars')).slice(0, 2);
  const [early, late] = a.year < b.year ? [a, b] : [b, a];
  return {
    q: `Which came ${q('first')}?`,
    a: `${early.film}: ${early.did.charAt(0).toLowerCase() + early.did.slice(1)}`,
    wrong: [`${late.film}: ${late.did.charAt(0).toLowerCase() + late.did.slice(1)}`],
    why: `${early.film} (${early.year}) came before ${late.film} (${late.year}).`,
  };
}

/* ---------------- lesson 5: element, choice, effect ---------------- */

interface Answer {
  el: string;
  choice: string;
  effect: string;
  full: string;
  noEffect: string;
  noChoice: string;
}
const ANSWERS: Answer[] = [
  {
    el: 'instrumentation',
    choice: 'low tremolo strings',
    effect: 'the audience feels that danger is close',
    full: 'The instrumentation uses low tremolo strings, so the audience feels that danger is close.',
    noEffect: 'The composer uses low tremolo strings.',
    noChoice: 'The instruments are scary, so the audience feels nervous.',
  },
  {
    el: 'tempo',
    choice: 'gradually speeds up',
    effect: 'the audience feels the urgency of the chase',
    full: 'The tempo gradually speeds up, so the audience feels the urgency of the chase.',
    noEffect: 'The tempo gradually speeds up.',
    noChoice: 'The music makes the chase feel urgent.',
  },
  {
    el: 'dynamics',
    choice: 'a long crescendo',
    effect: 'the tension rises towards the climax',
    full: 'The dynamics build with a long crescendo, so the tension rises towards the climax.',
    noEffect: 'There is a long crescendo.',
    noChoice: 'The music gets more exciting, so the audience is on the edge of their seat.',
  },
  {
    el: 'harmony',
    choice: 'dissonant, unresolved chords',
    effect: 'the scene feels unstable and dangerous',
    full: 'The harmony uses dissonant, unresolved chords, so the scene feels unstable and dangerous.',
    noEffect: 'The composer uses dissonant, unresolved chords.',
    noChoice: 'The music sounds wrong, so the audience feels uncomfortable.',
  },
  {
    el: 'articulation',
    choice: 'smooth legato strings',
    effect: 'the goodbye feels tender and loving',
    full: 'The articulation is smooth legato strings, so the goodbye feels tender and loving.',
    noEffect: 'The strings play legato.',
    noChoice: 'The music is beautiful, so the audience feels emotional.',
  },
  {
    el: 'pitch / register',
    choice: 'a very high register',
    effect: 'the character seems fragile and small',
    full: 'The melody is in a very high register, so the character seems fragile and small.',
    noEffect: 'The melody is played very high.',
    noChoice: 'The music makes the character seem weak.',
  },
  {
    el: 'texture',
    choice: 'a single, sparse melody line',
    effect: 'the character seems lonely and isolated',
    full: 'The texture is a single, sparse melody line, so the character seems lonely and isolated.',
    noEffect: 'There is only one melody line.',
    noChoice: 'The music is sad, so the audience feels sorry for the character.',
  },
  {
    el: 'tempo',
    choice: 'a slow tempo',
    effect: 'the audience feels the weight of the character’s grief',
    full: 'The slow tempo makes the audience feel the weight of the character’s grief.',
    noEffect: 'The composer uses a slow tempo.',
    noChoice: 'The music is very sad, so the audience cries.',
  },
];
const GENERAL = [
  'Film music is important because it helps to tell the story.',
  'The soundtrack is really good and fits the film well.',
  'The composer is very famous and talented.',
];

const WRITE_ITEMS: Item[] = [
  ...ANSWERS.map((x) => ({
    q: `A strong answer names the ${q('element')}, the specific ${q('choice')} and the ${q('effect')} on the audience. Which answer does all three?`,
    a: x.full,
    wrong: [x.noEffect, x.noChoice, ...GENERAL],
    why: `It names the element (${x.el}), the choice (${x.choice}) and the effect (${x.effect}).`,
  })),
  ...ANSWERS.map((x) => ({
    q: `A student writes: ${say(x.noEffect)}<br><span class="sub">What is still missing from a strong answer?</span>`,
    a: 'The effect on the audience',
    wrong: ['The name of the composer', 'Another musical element', 'A definition of the element', 'The year the film came out'],
    why: `It has the element and the choice, but not how it makes the audience feel. For example: “…, so ${x.effect}.”`,
  })),
  ...ANSWERS.map((x) => ({
    q: `A student writes: ${say(x.noChoice)}<br><span class="sub">What is still missing from a strong answer?</span>`,
    a: 'The musical element and the specific choice',
    wrong: ['The effect on the audience', 'The name of the film', 'Nothing, it is a strong answer'],
    why: `It only gives a feeling. Name the element and the choice, e.g. “${x.full}”`,
  })),
  ...ANSWERS.map((x) => ({
    q: `${say(x.full)}<br><span class="sub">Which part is the ${q('effect')}?</span>`,
    a: x.effect,
    wrong: [x.el, x.choice],
    why: `Element: ${x.el}. Choice: ${x.choice}. Effect: ${x.effect}.`,
  })),
  ...ANSWERS.map((x) => ({
    q: `${say(x.full)}<br><span class="sub">Which part is the specific ${q('choice')}?</span>`,
    a: x.choice,
    wrong: [x.el, x.effect],
    why: `Element: ${x.el}. Choice: ${x.choice}. Effect: ${x.effect}.`,
  })),
  {
    q: `Short answer: ${q('Explain how tempo and dynamics could build tension in a chase scene.')} Which is the strongest answer?`,
    a: 'The tempo gradually speeds up, so the audience feels the urgency of the chase. The dynamics build with a crescendo, so it feels like the danger is getting closer.',
    wrong: [
      'The music is fast and loud, which is exciting.',
      'Tempo is the speed of the music and dynamics is how loud it is.',
      'The composer uses a fast tempo and loud dynamics in the chase.',
    ],
    why: 'It names both elements (tempo, dynamics), a specific choice for each (speeding up, crescendo) and the effect (urgency, tension).',
  },
  {
    q: `Short answer: ${q('What is a leitmotif? Give an example and say why composers use them.')} Which is the strongest answer?`,
    a: 'A recurring theme linked to a character, place or idea, like Darth Vader’s theme in Star Wars. It helps the audience recognise the character each time, and it can change as the story changes.',
    wrong: [
      'A leitmotif is a song in a film, like the music in Star Wars.',
      'A leitmotif is a repeated pattern that builds tension, like Jaws.',
      'Darth Vader’s theme is a leitmotif because it is famous.',
    ],
    why: 'A full answer has a correct definition, a real example (Darth Vader, Hedwig) and a reason for using it.',
  },
  {
    q: `Short answer: ${q('Why was The Jazz Singer (1927) an important moment in film music history?')} Which is the strongest answer?`,
    a: 'It was the first major “talkie”, with synchronised dialogue and music, so film music moved from live pianists and organists to recorded scores packaged with the film.',
    wrong: [
      'It was the first film to use a leitmotif.',
      'It was the first film scored only with synthesizers.',
      'It had a very popular jazz soundtrack.',
    ],
    why: 'Key points: first major talkie (1927); synchronised sound and music; the shift from live accompanists to recorded scores.',
  },
];

/* ---------------- decks and problems ---------------- */

type Source = Item | (() => Item);
const decks = new Map<string, number[]>();

/** Next item index for a lesson: a shuffled deck, refilled when it runs out. */
function deal(id: string, n: number): number {
  let d = decks.get(id);
  if (!d || !d.length) {
    d = shuffle([...Array(n).keys()]);
    decks.set(id, d);
  }
  return d.shift()!;
}
/** Puts a missed question back a few places from the front of its deck. */
function again(id: string, i: number) {
  const d = decks.get(id) ?? [];
  d.splice(Math.min(d.length, 2 + Math.floor(Math.random() * 3)), 0, i);
  decks.set(id, d);
}

export function toProblem(it: Item, inst: string): Problem {
  const wrong = shuffle([...new Set(it.wrong)].filter((w) => w !== it.a)).slice(0, 3);
  const choices = it.fixed ? [it.a, ...wrong] : shuffle([it.a, ...wrong]);
  return {
    inst,
    q: `<div class="mq">${it.q}</div>`,
    sample: '',
    lhs: '',
    ans: F(0),
    kind: 'choice',
    choices,
    correct: choices.indexOf(it.a),
    work: [{ l: '', r: '', full: '' }, { l: '', r: '', why: it.why, full: it.a }],
  };
}

function lesson(id: string, inst: string, sources: Source[], sample: string) {
  return () => {
    const i = deal(id, sources.length);
    const s = sources[i];
    const p = toProblem(typeof s === 'function' ? s() : s, inst);
    p.sample = `<span class="msamp">${sample}</span>`;
    p.onMiss = () => again(id, i);
    return p;
  };
}

/** Every bank, for tests and the mixed lesson. */
export const BANKS: Record<string, Source[]> = {
  'mus-vocab': VOCAB,
  'mus-mood': MOOD_ITEMS,
  'mus-func': FUNC_ITEMS,
  'mus-hist': [...HIST_ITEMS, orderItem, orderItem, orderItem, firstItem, firstItem, firstItem],
  'mus-write': WRITE_ITEMS,
};
const ALL = Object.values(BANKS).flat();

export const MUSIC_TOPICS: Topic[] = [
  { id: 'mus-vocab', group: GROUP, name: 'Key vocabulary', op: '', gen: lesson('mus-vocab', 'Choose the best answer.', VOCAB, 'Leitmotif? Ostinato? Hit point?') },
  { id: 'mus-mood', group: GROUP, name: 'Elements & mood', op: '', gen: lesson('mus-mood', 'Choose the best answer.', MOOD_ITEMS, 'Tension or warmth?') },
  { id: 'mus-func', group: GROUP, name: 'What the music is doing', op: '', gen: lesson('mus-func', 'Choose the best answer.', FUNC_ITEMS, 'Foreshadowing? Setting?') },
  { id: 'mus-hist', group: GROUP, name: 'History of film scoring', op: '', gen: lesson('mus-hist', 'Choose the best answer.', BANKS['mus-hist'], '1927 → 1933 → 1960 → 1975 → 1982 → 2010') },
  { id: 'mus-write', group: GROUP, name: 'Element → choice → effect', op: '', gen: lesson('mus-write', 'Choose the best answer.', WRITE_ITEMS, 'Write a strong answer') },
  { id: 'mus-mix', group: GROUP, name: 'Mixed test', op: '', gen: lesson('mus-mix', 'Mixed practice: choose the best answer.', ALL, 'Everything, shuffled') },
];

