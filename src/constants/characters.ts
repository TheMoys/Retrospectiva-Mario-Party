import { Character, CharacterId } from '@/types/game';

export const CHARACTERS: Record<CharacterId, Character> = {
  mario: {
    id: 'mario',
    name: 'Boo',
    color: '#F8FAFC',
    secondaryColor: '#818CF8',
    neonColor: '#38BDF8',
    laneIndex: 0, // Carril Cian Fantasmal
    avatar: '👻',
    soundName: 'mario',
  },
  bowser: {
    id: 'bowser',
    name: 'Huesitos',
    color: '#CBD5E1',
    secondaryColor: '#0D9488',
    neonColor: '#2DD4BF',
    laneIndex: 1, // Carril Turquesa Hueso
    avatar: '🦴',
    soundName: 'bowser',
  },
  toad: {
    id: 'toad',
    name: 'ShyGuy',
    color: '#E11D48',
    secondaryColor: '#FFFFFF',
    neonColor: '#FB7185',
    laneIndex: 2, // Carril Rubí Máscara
    avatar: '🎭',
    soundName: 'toad',
  },
  luigi: {
    id: 'luigi',
    name: 'Luigi',
    color: '#43B047',
    secondaryColor: '#002688',
    neonColor: '#00ff66',
    laneIndex: 3, // Verde neón
    avatar: '🟢',
    soundName: 'luigi',
  },
  yoshi: {
    id: 'yoshi',
    name: 'Yoshi',
    color: '#00CCFF',
    secondaryColor: '#FF7700',
    neonColor: '#00ccff',
    laneIndex: 4, // Azul cielo neón
    avatar: '🦖',
    soundName: 'yoshi',
  },
  peach: {
    id: 'peach',
    name: 'Rosalina',
    color: '#06B6D4',
    secondaryColor: '#FDE047',
    neonColor: '#00F0FF',
    laneIndex: 5, // Azul Estelar / Celeste Neón
    avatar: '✨',
    soundName: 'peach',
  },
};

export const CHARACTER_LIST: Character[] = Object.values(CHARACTERS);

export const DEFAULT_TEAM_MEMBERS = [
  { name: 'Alex', role: 'Front', characterId: 'mario' as CharacterId }, // Boo
  { name: 'Sofía', role: 'Back', characterId: 'luigi' as CharacterId }, // Luigi
  { name: 'Mateo', role: 'QA', characterId: 'peach' as CharacterId }, // Rosalina
  { name: 'Lucía', role: 'UX', characterId: 'yoshi' as CharacterId }, // Yoshi
  { name: 'Carlos', role: 'DevOps', characterId: 'bowser' as CharacterId }, // Huesitos
  { name: 'Elena', role: 'PO', characterId: 'toad' as CharacterId }, // ShyGuy
];
