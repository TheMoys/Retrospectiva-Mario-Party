import {
  CableColorId,
  DefuseRoundConfig,
  MinigameType,
  PipelineStepId,
  PriceIsRightQuestion,
  RhythmLane,
  RhythmNote,
  StroopColorId,
  StroopPrompt,
} from '@/types/game';

export interface QuickVoteQuestion {
  id: string;
  question: string;
  emoji: string;
}

export const QUICK_VOTE_QUESTIONS: QuickVoteQuestion[] = [
  { id: '1', question: '¿Quién resolvió el bug más infernal o imposible del sprint?', emoji: '🐛' },
  { id: '2', question: '¿Quién salvó el sprint con un commit épico a última hora?', emoji: '🦸' },
  { id: '3', question: '¿Quién necesita urgentemente una taza gigante de café?', emoji: '☕' },
  { id: '4', question: '¿Quién fue el compañero más atento y dispuesto a hacer pair-programming?', emoji: '🤝' },
  { id: '5', question: '¿Quién escribió los tests más meticulosos y blindados?', emoji: '🧪' },
  { id: '6', question: '¿Quién mantuvo los ánimos y la diversión en los momentos de estrés?', emoji: '🎉' },
];

export function getRandomVoteQuestion(): QuickVoteQuestion {
  const index = Math.floor(Math.random() * QUICK_VOTE_QUESTIONS.length);
  return QUICK_VOTE_QUESTIONS[index];
}

export const ALL_MINIGAME_TYPES: MinigameType[] = [
  'block_smash',
  'quick_vote',
  'blind_timer',
  'planning_poker',
  'simon_pipeline',
  'defuse_p0',
  'chicken_meeting',
  'dev_price_is_right',
  'sprint_rhythm',
  'stroop_bug',
];

export const FIBONACCI_CARDS = [1, 2, 3, 5, 8, 13] as const;

export interface PipelineStepDefinition {
  id: PipelineStepId;
  label: string;
  emoji: string;
  freq: number;
  restingClass: string;
  activeClass: string;
  badgeClass: string;
}

export const PIPELINE_STEPS: PipelineStepDefinition[] = [
  {
    id: 'code',
    label: 'CODE',
    emoji: '💻',
    freq: 392.0,
    restingClass: 'bg-sky-950/90 border-sky-400/50 text-sky-100 hover:bg-sky-900/90',
    activeClass: 'bg-sky-400 border-white text-slate-950 scale-105 shadow-[0_0_24px_rgba(56,189,248,0.85)]',
    badgeClass: 'bg-sky-500/20 border-sky-400/60 text-sky-200',
  },
  {
    id: 'test',
    label: 'TEST',
    emoji: '🧪',
    freq: 523.25,
    restingClass: 'bg-emerald-950/90 border-emerald-400/50 text-emerald-100 hover:bg-emerald-900/90',
    activeClass: 'bg-emerald-400 border-white text-slate-950 scale-105 shadow-[0_0_24px_rgba(52,211,153,0.85)]',
    badgeClass: 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200',
  },
  {
    id: 'deploy',
    label: 'DEPLOY',
    emoji: '🚀',
    freq: 659.25,
    restingClass: 'bg-amber-950/90 border-amber-400/50 text-amber-100 hover:bg-amber-900/90',
    activeClass: 'bg-amber-400 border-white text-slate-950 scale-105 shadow-[0_0_24px_rgba(251,191,36,0.85)]',
    badgeClass: 'bg-amber-500/20 border-amber-400/60 text-amber-200',
  },
  {
    id: 'hotfix',
    label: 'HOTFIX',
    emoji: '🔥',
    freq: 783.99,
    restingClass: 'bg-rose-950/90 border-rose-400/50 text-rose-100 hover:bg-rose-900/90',
    activeClass: 'bg-rose-400 border-white text-slate-950 scale-105 shadow-[0_0_24px_rgba(251,113,133,0.85)]',
    badgeClass: 'bg-rose-500/20 border-rose-400/60 text-rose-200',
  },
];

export const PIPELINE_STEP_MAP: Record<PipelineStepId, PipelineStepDefinition> = {
  code: PIPELINE_STEPS[0],
  test: PIPELINE_STEPS[1],
  deploy: PIPELINE_STEPS[2],
  hotfix: PIPELINE_STEPS[3],
};

export interface DefuseCableDefinition {
  id: CableColorId;
  label: string;
  emoji: string;
  buttonClass: string;
  wireClass: string;
}

export const DEFUSE_CABLES: DefuseCableDefinition[] = [
  {
    id: 'red',
    label: 'ROJO',
    emoji: '🔴',
    buttonClass: 'bg-rose-950/90 border-rose-400 text-rose-100 hover:bg-rose-900/95',
    wireClass: 'bg-rose-500',
  },
  {
    id: 'blue',
    label: 'AZUL',
    emoji: '🔵',
    buttonClass: 'bg-sky-950/90 border-sky-400 text-sky-100 hover:bg-sky-900/95',
    wireClass: 'bg-sky-400',
  },
  {
    id: 'green',
    label: 'VERDE',
    emoji: '🟢',
    buttonClass: 'bg-emerald-950/90 border-emerald-400 text-emerald-100 hover:bg-emerald-900/95',
    wireClass: 'bg-emerald-400',
  },
  {
    id: 'yellow',
    label: 'AMARILLO',
    emoji: '🟡',
    buttonClass: 'bg-amber-950/90 border-amber-400 text-amber-100 hover:bg-amber-900/95',
    wireClass: 'bg-yellow-400',
  },
];

export const DEFUSE_CABLE_MAP: Record<CableColorId, DefuseCableDefinition> = {
  red: DEFUSE_CABLES[0],
  blue: DEFUSE_CABLES[1],
  green: DEFUSE_CABLES[2],
  yellow: DEFUSE_CABLES[3],
};

export const PRICE_IS_RIGHT_QUESTIONS: PriceIsRightQuestion[] = [
  {
    id: 'agile-manifesto',
    question: '¿En qué año se publicó oficialmente el Manifiesto Ágil?',
    answer: 2001,
    min: 1990,
    max: 2020,
    step: 1,
    unit: '',
  },
  {
    id: 'git-created',
    question: '¿En qué año creó Linus Torvalds la primera versión de Git?',
    answer: 2005,
    min: 1995,
    max: 2020,
    step: 1,
    unit: '',
  },
  {
    id: 'ipv6-bits',
    question: '¿Cuántos bits tiene una dirección IPv6?',
    answer: 128,
    min: 16,
    max: 256,
    step: 8,
    unit: 'bits',
  },
  {
    id: 'http-teapot',
    question: '¿Cuál es el famoso código HTTP "I\'m a teapot"?',
    answer: 418,
    min: 200,
    max: 599,
    step: 1,
    unit: '',
  },
  {
    id: 'typescript-year',
    question: '¿En qué año lanzó Microsoft TypeScript por primera vez?',
    answer: 2012,
    min: 2000,
    max: 2022,
    step: 1,
    unit: '',
  },
  {
    id: 'docker-year',
    question: '¿En qué año se lanzó Docker públicamente?',
    answer: 2013,
    min: 2005,
    max: 2022,
    step: 1,
    unit: '',
  },
  {
    id: 'react-year',
    question: '¿En qué año se liberó React como código abierto?',
    answer: 2013,
    min: 2005,
    max: 2022,
    step: 1,
    unit: '',
  },
  {
    id: 'ssh-port',
    question: '¿Qué puerto TCP estándar utiliza el protocolo SSH?',
    answer: 22,
    min: 1,
    max: 100,
    step: 1,
    unit: '',
  },
  {
    id: 'https-port',
    question: '¿Qué puerto TCP estándar utiliza HTTPS?',
    answer: 443,
    min: 80,
    max: 1000,
    step: 1,
    unit: '',
  },
  {
    id: 'ascii-chars',
    question: '¿Cuántos caracteres tiene el estándar ASCII básico (7 bits)?',
    answer: 128,
    min: 32,
    max: 256,
    step: 8,
    unit: 'caracteres',
  },
];

export function getRandomPriceQuestion(): PriceIsRightQuestion {
  const index = Math.floor(Math.random() * PRICE_IS_RIGHT_QUESTIONS.length);
  return PRICE_IS_RIGHT_QUESTIONS[index];
}

export interface RhythmLaneDefinition {
  lane: RhythmLane;
  label: string;
  symbol: string;
  activeBgClass: string;
  noteBgClass: string;
  buttonClass: string;
}

export const RHYTHM_LANES: RhythmLaneDefinition[] = [
  {
    lane: 0,
    label: 'CODE',
    symbol: '◀',
    activeBgClass: 'bg-cyan-400 text-slate-950 border-white',
    noteBgClass: 'bg-cyan-400 border-white text-slate-950 shadow-[0_0_16px_rgba(34,211,238,0.85)]',
    buttonClass: 'bg-cyan-950/95 border-cyan-400 text-cyan-100 hover:bg-cyan-900',
  },
  {
    lane: 1,
    label: 'TEST',
    symbol: '●',
    activeBgClass: 'bg-emerald-400 text-slate-950 border-white',
    noteBgClass: 'bg-emerald-400 border-white text-slate-950 shadow-[0_0_16px_rgba(52,211,153,0.85)]',
    buttonClass: 'bg-emerald-950/95 border-emerald-400 text-emerald-100 hover:bg-emerald-900',
  },
  {
    lane: 2,
    label: 'DEPLOY',
    symbol: '▶',
    activeBgClass: 'bg-amber-400 text-slate-950 border-white',
    noteBgClass: 'bg-amber-400 border-white text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.85)]',
    buttonClass: 'bg-amber-950/95 border-amber-400 text-amber-100 hover:bg-amber-900',
  },
];

export interface StroopColorDefinition {
  id: StroopColorId;
  word: string;
  inkTextClass: string;
  buttonClass: string;
}

export const STROOP_COLORS: StroopColorDefinition[] = [
  {
    id: 'red',
    word: 'ROJO',
    inkTextClass: 'text-rose-400',
    buttonClass: 'bg-rose-700 hover:bg-rose-600 border-rose-300 text-white',
  },
  {
    id: 'blue',
    word: 'AZUL',
    inkTextClass: 'text-sky-400',
    buttonClass: 'bg-blue-700 hover:bg-blue-600 border-sky-300 text-white',
  },
  {
    id: 'green',
    word: 'VERDE',
    inkTextClass: 'text-emerald-400',
    buttonClass: 'bg-emerald-800 hover:bg-emerald-700 border-emerald-300 text-white',
  },
  {
    id: 'yellow',
    word: 'AMARILLO',
    inkTextClass: 'text-yellow-300',
    buttonClass: 'bg-yellow-400 hover:bg-yellow-300 border-yellow-100 text-slate-950',
  },
];

export const STROOP_COLOR_MAP: Record<StroopColorId, StroopColorDefinition> = {
  red: STROOP_COLORS[0],
  blue: STROOP_COLORS[1],
  green: STROOP_COLORS[2],
  yellow: STROOP_COLORS[3],
};

export interface MinigameMetadata {
  id: MinigameType;
  title: string;
  shortName: string;
  category: string;
  emoji: string;
  accentClasses: string;
  durationMs: number;
  subtitle: string;
  reward: string;
  rules: string[];
  controllerHint: string;
  metricLabel: string;
}

export const MINIGAME_CATALOG: Record<MinigameType, MinigameMetadata> = {
  block_smash: {
    id: 'block_smash',
    title: '¡MACHACA EL BLOQUE ?!',
    shortName: 'Machaca',
    category: 'Reflejos',
    emoji: '⚡',
    accentClasses: 'border-amber-400/60 bg-amber-500/15 text-amber-200',
    durationMs: 8000,
    subtitle: 'Destreza y velocidad extrema individual',
    reward: '+2 ESTRELLAS para el más rápido',
    rules: [
      'Toca repetidamente el bloque amarillo en tu Joy-Phone.',
      'Tienes exactamente 8 segundos antes de que expire el cronómetro.',
      'El jugador con el mayor número de golpes gana las 2 Estrellas.',
    ],
    controllerHint: 'PULSA EL BLOQUE REPETIDAMENTE',
    metricLabel: 'golpes',
  },
  quick_vote: {
    id: 'quick_vote',
    title: '¿QUIÉN DEL EQUIPO...?',
    shortName: 'Votar',
    category: 'Social',
    emoji: '🗳️',
    accentClasses: 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200',
    durationMs: 12000,
    subtitle: 'Votación secreta y sincera del Sprint',
    reward: '+2 ESTRELLAS para la persona más votada',
    rules: [
      'Lee la pregunta ágil proyectada en la pantalla grande.',
      'Toca el avatar de tu compañero en tu Joy-Phone antes de que acabe el tiempo.',
      '¡Tu voto es 100% secreto hasta el recuento final!',
    ],
    controllerHint: 'TOCA UN AVATAR PARA VOTAR',
    metricLabel: 'votos',
  },
  blind_timer: {
    id: 'blind_timer',
    title: 'DEPLOY A CIEGAS',
    shortName: 'Deploy',
    category: 'Precisión',
    emoji: '⏱️',
    accentClasses: 'border-violet-400/60 bg-violet-500/15 text-violet-200',
    durationMs: 13000,
    subtitle: 'Pulsa deploy en el segundo exacto sin mirar el reloj',
    reward: '+2 ESTRELLAS para el deploy más preciso',
    rules: [
      'Observa el tiempo objetivo proyectado en pantalla (por ejemplo, 7.00 s).',
      'El cronómetro desaparecerá a los 2.00 segundos: sigue contando mentalmente.',
      'Pulsa ¡LANZAR DEPLOY! una sola vez lo más cerca posible de la meta.',
    ],
    controllerHint: 'CUENTA MENTALMENTE Y PULSA DEPLOY',
    metricLabel: 'desvío',
  },
  planning_poker: {
    id: 'planning_poker',
    title: 'PLANNING POKER TRAICIONERO',
    shortName: 'Poker',
    category: 'Estrategia',
    emoji: '🃏',
    accentClasses: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
    durationMs: 14000,
    subtitle: 'Elige la carta Fibonacci más alta que nadie más repita',
    reward: '+2 ESTRELLAS para la carta única más alta',
    rules: [
      'Elige en secreto una carta Fibonacci (1, 2, 3, 5, 8 o 13) en tu Joy-Phone.',
      'Si dos o más compañeros eligen el mismo número, esas cartas ¡chocan y se anulan!',
      'Gana quien conserve la carta ÚNICA más alta al revelarse todas a la vez.',
    ],
    controllerHint: 'ELIGE UNA CARTA FIBONACCI SECRETA',
    metricLabel: 'carta',
  },
  simon_pipeline: {
    id: 'simon_pipeline',
    title: 'SECUENCIA DE PIPELINE',
    shortName: 'Pipeline',
    category: 'Memoria',
    emoji: '🧠',
    accentClasses: 'border-pink-400/60 bg-pink-500/15 text-pink-200',
    durationMs: 28000,
    subtitle: 'Memoriza y replica el CI/CD sin romper producción',
    reward: '+2 ESTRELLAS para quien supere más rondas',
    rules: [
      'Observa en tu Joy-Phone el orden en que se iluminan CODE, TEST, DEPLOY y HOTFIX.',
      'Repite exactamente la secuencia en tu turno; cada ronda añade un paso más.',
      'Si fallas quedas fuera, pero conservas tus rondas completadas. ¡Aguanta 28 s!',
    ],
    controllerHint: 'MEMORIZA Y REPITE LOS 4 PADS',
    metricLabel: 'rondas',
  },
  defuse_p0: {
    id: 'defuse_p0',
    title: 'CORTA EL CABLE P0',
    shortName: 'Cable P0',
    category: 'Tensión',
    emoji: '✂️',
    accentClasses: 'border-rose-400/60 bg-rose-500/15 text-rose-200',
    durationMs: 28000,
    subtitle: '3 rondas: evita el cable bomba y caza el de +3 pts',
    reward: '+2 ESTRELLAS para el mayor puntaje acumulado',
    rules: [
      'Hay 4 cables secretos en cada una de las 3 rondas: 1 detona un P0 (0 pts) y 3 suman +1, +2 o +3 pts.',
      'Elige en secreto qué cable cortar en tu Joy-Phone en menos de 8 segundos.',
      'Al revelarse cada ronda verás quién esquivó la caída de producción. ¡Gana la suma total!',
    ],
    controllerHint: 'ELIGE EL CABLE SEGURO EN CADA RONDA',
    metricLabel: 'pts',
  },
  chicken_meeting: {
    id: 'chicken_meeting',
    title: 'LA REUNIÓN INTERMINABLE',
    shortName: 'Reunión',
    category: 'Riesgo',
    emoji: '🚪',
    accentClasses: 'border-teal-400/60 bg-teal-500/15 text-teal-200',
    durationMs: 12000,
    subtitle: 'Aguanta sumando puntos y sal antes de que añadan alcance',
    reward: '+2 ESTRELLAS para quien escape más tarde sin caer',
    rules: [
      'Mientras sigas conectado en la call el bote de puntos sube sin parar.',
      'En cualquier segundo sorpresa llegará "un cambio pequeño del cliente" y cerrará la sala con 0 pts.',
      'Pulsa ¡SALIR DE LA REUNIÓN! justo antes del colapso para asegurar tu bote.',
    ],
    controllerHint: 'AGUANTA Y ESCAPA ANTES DEL CIERRE',
    metricLabel: 'pts',
  },
  dev_price_is_right: {
    id: 'dev_price_is_right',
    title: 'EL PRECIO JUSTO DEV',
    shortName: 'Precio Dev',
    category: 'Estimación',
    emoji: '📏',
    accentClasses: 'border-indigo-400/60 bg-indigo-500/15 text-indigo-200',
    durationMs: 14000,
    subtitle: 'Adivina el dato técnico exacto sin pasarte',
    reward: '+2 ESTRELLAS al más cercano sin pasarse',
    rules: [
      'Lee la pregunta de cultura dev/Agile proyectada en la pantalla principal.',
      'Ajusta tu número con el deslizador o botones -/+ y confirma tu estimación secreta.',
      'Gana quien quede más cerca del valor exacto SIN pasarse (si todos se pasan, gana el más cercano).',
    ],
    controllerHint: 'AJUSTA TU ESTIMACIÓN SIN PASARTE',
    metricLabel: 'valor',
  },
  sprint_rhythm: {
    id: 'sprint_rhythm',
    title: 'RITMO DEL SPRINT',
    shortName: 'Ritmo',
    category: 'Ritmo',
    emoji: '🎵',
    accentClasses: 'border-orange-400/60 bg-orange-500/15 text-orange-200',
    durationMs: 14000,
    subtitle: 'Toca los acordes de CODE, TEST y DEPLOY al ritmo',
    reward: '+2 ESTRELLAS para la mayor puntuación y combo',
    rules: [
      'Las notas caerán por 3 carriles (◀ CODE, ● TEST, ▶ DEPLOY) hacia la zona meta.',
      'Pulsa el botón justo cuando la nota llegue a la línea luminosa para encadenar combos.',
      '¡Cuanto mayor sea tu racha sin fallos, más puntos sumas en 14 segundos!',
    ],
    controllerHint: 'PULSA CADA CARRIL AL LLEGAR LA NOTA',
    metricLabel: 'pts',
  },
  stroop_bug: {
    id: 'stroop_bug',
    title: 'EL BUG DE COLOR',
    shortName: 'Bug Color',
    category: 'Mente',
    emoji: '🎨',
    accentClasses: 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200',
    durationMs: 18000,
    subtitle: 'Distingue si te piden el COLOR de tinta o la PALABRA',
    reward: '+2 ESTRELLAS para más aciertos en menor tiempo',
    rules: [
      'Verás palabras de colores pintadas con otra tinta distinta (efecto Stroop).',
      'Fíjate bien en la regla superior de cada reto: ¿TINTA o PALABRA?',
      'Supera los 6 retos en tu Joy-Phone lo antes posible sin caer en la trampa.',
    ],
    controllerHint: 'LEE LA REGLA Y TOCA EL COLOR CORRECTO',
    metricLabel: 'aciertos',
  },
};

/** Pick a random minigame avoiding immediate repetition when alternatives exist. */
export function pickRandomMinigame(lastType?: MinigameType): MinigameType {
  const candidates = ALL_MINIGAME_TYPES.filter((type) => type !== lastType);
  const pool = candidates.length > 0 ? candidates : ALL_MINIGAME_TYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Generate a pipeline memory sequence avoiding 3 identical consecutive steps. */
export function generatePipelineSequence(length = 10): PipelineStepId[] {
  const stepIds: PipelineStepId[] = PIPELINE_STEPS.map((step) => step.id);
  const sequence: PipelineStepId[] = [];

  for (let i = 0; i < length; i++) {
    let available = stepIds;
    if (i >= 2 && sequence[i - 1] === sequence[i - 2]) {
      available = stepIds.filter((id) => id !== sequence[i - 1]);
    }
    sequence.push(available[Math.floor(Math.random() * available.length)]);
  }

  return sequence;
}

/** Choose an integer-second blind timer target between 5.00 s and 8.00 s. */
export function pickBlindTargetMs(): number {
  const targets = [5000, 6000, 7000, 8000];
  return targets[Math.floor(Math.random() * targets.length)];
}

/** Build N shuffled rounds for Defuse Cable P0 (one bomb = 0 pts, safe cables = +1, +2, +3). */
export function generateDefuseRounds(count = 3): DefuseRoundConfig[] {
  const cables: CableColorId[] = ['red', 'blue', 'green', 'yellow'];
  const rounds: DefuseRoundConfig[] = [];

  for (let r = 0; r < count; r++) {
    const shuffled = [...cables].sort(() => Math.random() - 0.5);
    const bombCable = shuffled[0];
    const pointsByCable: Record<CableColorId, number> = {
      [shuffled[0]]: 0,
      [shuffled[1]]: 3,
      [shuffled[2]]: 2,
      [shuffled[3]]: 1,
    } as Record<CableColorId, number>;
    rounds.push({ bombCable, pointsByCable });
  }

  return rounds;
}

/** Pick secret meeting crash instant between 4.5s and 9.5s. */
export function pickMeetingCrashMs(): number {
  return 4500 + Math.floor(Math.random() * 5000);
}

/** Compute escalating pot points based on seconds stayed in Chicken Meeting. */
export function computeMeetingPoints(elapsedMs: number): number {
  return Math.max(10, Math.round(Math.pow(Math.max(0, elapsedMs) / 1000, 1.8) * 15));
}

/** Generate 20 upbeat pentatonic rhythm notes spaced smoothly across 14s. */
export function generateRhythmNotes(): RhythmNote[] {
  const freqs = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
  const notes: RhythmNote[] = [];
  let currentMs = 1500;
  let lastLane: RhythmLane = 0;

  for (let i = 0; i < 20; i++) {
    const stepMs = i % 3 === 2 ? 620 : 530;
    const laneCandidates: RhythmLane[] = [0, 1, 2];
    const filtered = laneCandidates.filter((l) => l !== lastLane || Math.random() < 0.25);
    const lane = filtered[Math.floor(Math.random() * filtered.length)] ?? ((i % 3) as RhythmLane);
    lastLane = lane;
    notes.push({
      id: i + 1,
      lane,
      timeMs: currentMs,
      freq: freqs[i % freqs.length],
    });
    currentMs += stepMs;
  }

  return notes;
}

/** Generate N Stroop bug prompts where ink color NEVER matches written color word. */
export function generateStroopPrompts(count = 6): StroopPrompt[] {
  const colorIds: StroopColorId[] = ['red', 'blue', 'green', 'yellow'];
  const prompts: StroopPrompt[] = [];

  for (let i = 0; i < count; i++) {
    const wordColor = colorIds[Math.floor(Math.random() * colorIds.length)];
    const otherColors = colorIds.filter((c) => c !== wordColor);
    const inkColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    const rule: 'ink' | 'word' = i % 2 === 0 ? 'ink' : 'word';
    prompts.push({ wordColor, inkColor, rule });
  }

  return prompts;
}
