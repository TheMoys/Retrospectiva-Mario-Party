import { MinigameType, PipelineStepId } from '@/types/game';

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
    shortName: 'Deploy ⏱️',
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
    shortName: 'Poker 🃏',
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
    shortName: 'Pipeline 🧠',
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
