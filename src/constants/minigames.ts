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
