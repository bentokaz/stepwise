/**
 * Written-answer practice for Music in Film: most of the real test was free writing,
 * including naming the history milestones from memory. Answers are checked for key points
 * (any one word from each list counts), then a model answer is shown.
 */
import { F } from '../math/core';
import type { Problem } from '../math/topics';

export interface Written {
  q: string;
  points: { label: string; any: string[] }[];
  model: string;
}

const EFFECT = ['audience', 'feel', 'tension', 'suspense', 'mood', 'nervous', 'scared', 'fear', 'uneas', 'excit', 'urgen', 'emotion', 'sad', 'calm', 'happy', 'danger'];
const effect = (label = 'the effect on the audience') => ({ label, any: EFFECT });

export const RECALL: Written[] = [
  {
    q: 'What happened in film music in <b>1927</b>, and why did it matter?',
    points: [
      { label: 'The Jazz Singer', any: ['jazz singer'] },
      { label: 'first “talkie” with synchronised sound', any: ['talkie', 'synchron', 'sound', 'dialogue'] },
      { label: 'live musicians replaced by recorded scores', any: ['live', 'pianist', 'organist', 'recorded', 'record'] },
    ],
    model:
      'The Jazz Singer (1927) was the first major “talkie”, with synchronised dialogue and music. Film music moved from live pianists and organists in the cinema to recorded scores packaged with the film.',
  },
  {
    q: 'How was music provided during the <b>silent film era (1895–1927)</b>, and what does that show?',
    points: [
      { label: 'live pianists or organists', any: ['pian', 'organ', 'live'] },
      { label: 'improvised to match the action', any: ['improvis', 'match', 'action', 'screen'] },
      { label: 'music was already important to storytelling', any: ['story', 'important', 'essential', 'needed'] },
    ],
    model:
      'Cinemas used live pianists or organists who improvised music to match the action on screen. It shows music was already essential to storytelling, even before recorded sound existed.',
  },
  {
    q: 'Who scored <b>King Kong (1933)</b>, and why was it a milestone?',
    points: [
      { label: 'Max Steiner', any: ['steiner'] },
      { label: 'lush, symphonic “Hollywood sound”', any: ['symphon', 'orchestra', 'hollywood', 'lush'] },
      { label: 'leitmotifs inspired by Wagner / opera', any: ['leitmotif', 'wagner', 'opera'] },
    ],
    model:
      'Max Steiner. In the 1930s Golden Age he created the lush, symphonic “Hollywood sound”, using leitmotifs inspired by 19th-century opera composers such as Wagner. It set the template composers still use.',
  },
  {
    q: 'What was unusual about <b>Bernard Herrmann’s score for Psycho (1960)</b>, and what did it show?',
    points: [
      { label: 'shrieking, dissonant strings', any: ['shriek', 'dissonan', 'screech', 'strings'] },
      { label: 'instead of a normal melody', any: ['melody', 'tune', 'abstract'] },
      { label: 'film music can be unsettling, not just beautiful', any: ['unsettl', 'disturb', 'scary', 'creepy', 'uneas', 'beautiful'] },
    ],
    model:
      'It used shrieking, dissonant strings instead of a conventional melody. It showed film music could be deliberately unsettling and abstract, not just there to add beauty.',
  },
  {
    q: 'What did <b>John Williams</b> do in the 1970s? Name at least one of his films.',
    points: [
      { label: 'Jaws (1975) or Star Wars (1977)', any: ['jaws', 'star wars'] },
      { label: 'revived the full orchestra', any: ['orchestra', 'symphon'] },
      { label: 'bold leitmotifs and ostinato', any: ['leitmotif', 'ostinato', 'theme'] },
    ],
    model:
      'John Williams revived the full orchestra in Jaws (1975) and Star Wars (1977), using bold leitmotifs and ostinato. It brought big orchestral scores back after a period dominated by pop and rock soundtracks.',
  },
  {
    q: 'Why was <b>Vangelis’s score for Blade Runner (1982)</b> important?',
    points: [
      { label: 'made almost entirely with synthesizers', any: ['synth', 'electronic'] },
      { label: 'created new textures and moods', any: ['new', 'textur', 'mood', 'different'] },
    ],
    model:
      'Vangelis scored Blade Runner almost entirely with synthesizers. It proved electronic instruments could create entirely new textures and moods, not just imitate an orchestra.',
  },
  {
    q: 'What is <b>hybrid scoring</b>? Name a composer and film that use it.',
    points: [
      { label: 'Hans Zimmer / Inception (2010)', any: ['zimmer', 'inception'] },
      { label: 'orchestral instruments', any: ['orchestra', 'traditional', 'strings', 'brass'] },
      { label: 'mixed with electronic / digital sound', any: ['electronic', 'digital', 'synth', 'computer'] },
    ],
    model: 'Hybrid scoring blends orchestral music with electronic and digital sound design. Hans Zimmer does this in Inception (2010).',
  },
  {
    q: 'Which milestone happened in <b>1960</b>? Name the film and the composer.',
    points: [
      { label: 'Psycho', any: ['psycho'] },
      { label: 'Bernard Herrmann', any: ['herrmann', 'herman'] },
    ],
    model: 'Psycho (1960), scored by Bernard Herrmann with shrieking, dissonant strings instead of a conventional melody.',
  },
  {
    q: 'Which milestone happened in <b>1982</b>? Name the film and the composer.',
    points: [
      { label: 'Blade Runner', any: ['blade runner'] },
      { label: 'Vangelis', any: ['vangelis'] },
    ],
    model: 'Blade Runner (1982), scored by Vangelis almost entirely with synthesizers.',
  },
  {
    q: 'Which milestone happened in <b>1933</b>? Name the film and the composer.',
    points: [
      { label: 'King Kong', any: ['king kong'] },
      { label: 'Max Steiner', any: ['steiner'] },
    ],
    model: 'King Kong (1933), scored by Max Steiner: the lush, symphonic Hollywood sound with Wagner-inspired leitmotifs.',
  },
  {
    q: 'Name the <b>two 1970s films</b> where John Williams revived the orchestra, with their years.',
    points: [
      { label: 'Jaws', any: ['jaws'] },
      { label: 'Star Wars', any: ['star wars'] },
      { label: 'the years (1975, 1977)', any: ['1975', '1977', '75', '77'] },
    ],
    model: 'Jaws (1975) and Star Wars (1977).',
  },
  {
    q: 'List the film music milestones <b>in order</b>, from the silent era to today (at least five).',
    points: [
      { label: 'silent era / live accompanists', any: ['silent', 'live', 'pian', 'organ'] },
      { label: 'The Jazz Singer (1927)', any: ['jazz singer', '1927'] },
      { label: 'King Kong / Steiner (1933)', any: ['king kong', 'steiner', '1933'] },
      { label: 'Psycho / Herrmann (1960)', any: ['psycho', 'herrmann', '1960'] },
      { label: 'Jaws / Star Wars / Williams (1970s)', any: ['jaws', 'star wars', 'williams', '1975', '1977'] },
      { label: 'Blade Runner / Vangelis (1982)', any: ['blade runner', 'vangelis', '1982'] },
    ],
    model:
      'Silent era (1895–1927): live pianists and organists → The Jazz Singer (1927): first talkie → King Kong (1933), Max Steiner: symphonic Hollywood sound → Psycho (1960), Bernard Herrmann: dissonant strings → Jaws (1975) / Star Wars (1977), John Williams: orchestral revival → Blade Runner (1982), Vangelis: synthesizers → Inception (2010), Hans Zimmer: hybrid scoring.',
  },
];

export const ESSAYS: Written[] = [
  {
    q: 'Explain how a composer could use <b>tempo and dynamics</b> to build tension in a chase scene.',
    points: [
      { label: 'tempo choice (e.g. gradually speeding up)', any: ['faster', 'speed', 'accelerat', 'quick', 'fast'] },
      { label: 'dynamics choice (e.g. a crescendo)', any: ['crescendo', 'louder', 'loud', 'volume'] },
      effect('the effect (urgency, tension)'),
    ],
    model:
      'The tempo gradually speeds up, so the audience feels the urgency of the chase. The dynamics build with a crescendo, so it feels like the danger is getting closer and the tension rises.',
  },
  {
    q: 'What is a <b>leitmotif</b>? Give an example and explain why composers use them.',
    points: [
      { label: 'a recurring theme', any: ['recurring', 'repeat', 'return', 'again', 'every time', 'whenever'] },
      { label: 'linked to a character, place or idea', any: ['character', 'place', 'idea', 'person', 'object'] },
      { label: 'a real example', any: ['vader', 'hedwig', 'star wars', 'harry potter', 'jaws', 'imperial'] },
      { label: 'why (recognition, development)', any: ['recogni', 'remind', 'identif', 'know', 'link', 'develop', 'change', 'connect'] },
    ],
    model:
      'A leitmotif is a recurring musical theme linked to a character, place or idea, like Darth Vader’s theme in Star Wars. Composers use them so the audience recognises the character whenever the theme returns, and the theme can develop as the story changes.',
  },
  {
    q: 'Explain how <b>harmony</b> could make a scene feel unsettling.',
    points: [
      { label: 'names harmony / chords', any: ['harmony', 'chord'] },
      { label: 'a choice (dissonant, minor, unresolved)', any: ['dissonan', 'minor', 'unresolved', 'clash'] },
      effect(),
    ],
    model: 'The harmony uses dissonant, unresolved chords, so the scene feels unstable and the audience feels uneasy, as if something is wrong.',
  },
  {
    q: 'Explain how <b>instrumentation</b> could make a character seem heroic.',
    points: [
      { label: 'names instrumentation / timbre', any: ['instrument', 'timbre'] },
      { label: 'a choice (e.g. brass, full orchestra)', any: ['brass', 'trumpet', 'horn', 'orchestra', 'drum', 'timpani'] },
      { label: 'the effect (heroic, powerful, confident)', any: ['hero', 'brave', 'power', 'strong', 'triumph', 'confiden', 'epic', 'bold'] },
    ],
    model: 'The instrumentation uses bold brass like trumpets and horns, so the character feels powerful and heroic to the audience.',
  },
  {
    q: 'Explain how <b>pitch / register</b> could make a character seem fragile.',
    points: [
      { label: 'names pitch / register', any: ['pitch', 'register'] },
      { label: 'a choice (a very high register)', any: ['high'] },
      { label: 'the effect (fragile, small, vulnerable)', any: ['fragile', 'weak', 'small', 'delicate', 'vulnerable', 'innocent', 'helpless'] },
    ],
    model: 'The melody is played in a very high register, so the character seems fragile and small to the audience.',
  },
  {
    q: 'Explain how <b>articulation</b> could make a goodbye scene feel tender.',
    points: [
      { label: 'names articulation', any: ['articulation', 'legato', 'staccato'] },
      { label: 'a choice (smooth, connected legato)', any: ['legato', 'smooth', 'connect'] },
      { label: 'the effect (tender, loving, emotional)', any: ['tender', 'love', 'sad', 'gentle', 'emotion', 'warm', 'soft', 'caring'] },
    ],
    model: 'The strings play with smooth, connected legato articulation, so the goodbye feels tender and loving to the audience.',
  },
  {
    q: 'Explain how <b>texture</b> could show that a character is lonely.',
    points: [
      { label: 'names texture / layers', any: ['texture', 'layer'] },
      { label: 'a choice (thin: one sparse line)', any: ['thin', 'sparse', 'single', 'one ', 'solo', 'few', 'only one'] },
      { label: 'the effect (lonely, isolated)', any: ['lonel', 'alone', 'isolat', 'empty', 'sad'] },
    ],
    model: 'The texture is thin, just a single sparse melody line, so the character seems lonely and isolated to the audience.',
  },
  {
    q: 'Explain how a composer could use <b>silence</b> (the music stopping) to build suspense.',
    points: [
      { label: 'the music stops / goes silent', any: ['stop', 'silence', 'silent', 'cut'] },
      { label: 'builds suspense / anticipation', any: ['suspense', 'tension', 'expect', 'wait', 'nervous', 'anticipat'] },
      { label: 'makes the next sound hit harder', any: ['next', 'after', 'jump', 'shock', 'sudden', 'loud', 'scare', 'surprise'] },
    ],
    model:
      'The music suddenly stops just before the character opens the door, so the audience waits nervously in silence, and the next sound feels much more shocking.',
  },
  {
    q: 'How can music <b>foreshadow</b> danger before it appears on screen? Give a specific musical choice.',
    points: [
      { label: 'hints at something before it happens', any: ['foreshadow', 'before', 'hint', 'warn', 'predict', 'coming', 'about to'] },
      { label: 'a musical choice (e.g. low drone, minor, dissonant)', any: ['drone', 'pedal', 'low', 'minor', 'dissonan', 'ostinato', 'tremolo'] },
      effect(),
    ],
    model:
      'During a happy scene a low, rumbling pedal tone slowly grows underneath, so the audience feels uneasy and senses that something bad is about to happen before it is shown.',
  },
  {
    q: 'How can <b>instrumentation</b> establish the setting, time period or culture? Give an example.',
    points: [
      { label: 'names instruments / style', any: ['instrument', 'timbre', 'style'] },
      { label: 'a specific example', any: ['taiko', 'shakuhachi', 'bagpipe', 'sitar', 'koto', 'banjo', 'jazz', 'harpsichord', 'erhu', 'didgeridoo', 'guitar', 'flute', 'drum'] },
      { label: 'tells us where or when', any: ['setting', 'place', 'culture', 'time', 'country', 'period', 'where', 'when', 'era'] },
    ],
    model: 'In a film set in feudal Japan, the instrumentation uses the shakuhachi flute and taiko drums, so the audience knows the place, time period and culture before anyone speaks.',
  },
  {
    q: 'Explain how an <b>ostinato</b> builds tension. Give an example.',
    points: [
      { label: 'a short pattern repeated', any: ['repeat', 'pattern', 'again', 'over and over', 'loop'] },
      { label: 'a real example', any: ['jaws', 'shark'] },
      { label: 'the effect (tension, momentum)', any: ['tension', 'suspense', 'momentum', 'drive', 'nervous', 'closer', 'build'] },
    ],
    model: 'An ostinato is a short pattern repeated persistently, like the two-note motif in Jaws. Repeating it again and again builds tension, as if the shark is getting closer.',
  },
  {
    q: 'A scene shows a <b>happy family reunion</b>. Describe two musical choices and their effect.',
    points: [
      { label: 'a harmony choice (consonant / major)', any: ['major', 'consonant', 'resolv'] },
      { label: 'another choice (legato, rich texture, strings, swelling)', any: ['legato', 'smooth', 'rich', 'layer', 'strings', 'swell', 'warm', 'full orchestra', 'crescendo'] },
      { label: 'the effect (warmth, joy)', any: ['warm', 'joy', 'happy', 'love', 'comfort', 'emotion', 'feel'] },
    ],
    model:
      'The harmony is consonant and in a major key, so the scene feels stable and happy. Warm legato strings swell into a rich, layered texture, so the audience feels the joy and love of the reunion.',
  },
];

export function toWritten(w: Written, inst: string): Problem {
  return {
    inst,
    q: `<div class="mq">${w.q}</div>`,
    sample: '',
    lhs: '',
    ans: F(0),
    kind: 'text',
    points: w.points,
    model: w.model,
    work: [
      { l: '', r: '', full: '' },
      { l: '', r: '', why: `A strong answer includes: ${w.points.map((p) => p.label).join('; ')}.`, full: w.model },
    ],
  };
}

const norm = (s: string) => ' ' + s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ') + ' ';
/** Which key points a written answer mentions (a word counts if any listed word starts a word in the answer). */
export function pointsFound(points: Written['points'], text: string): { label: string; ok: boolean }[] {
  const t = norm(text);
  return points.map((pt) => ({ label: pt.label, ok: pt.any.some((w) => t.includes(norm(w).slice(0, -1))) }));
}
