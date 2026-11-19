import { Character, CharacterId } from '@/types/game';

export const CHARACTERS: Record<CharacterId, Character> = {
  mario: {
    id: 'mario',
    name: 'Mario',
    color: '#E52521',
    secondaryColor: '#002688',
    neonColor: '#ff0033',
    laneIndex: 0, // Rojo neón
    avatar: '🔴',
    soundName: 'mario',
  },
  bowser: {
    id: 'bowser',
    name: 'Bowser',
    color: '#FF6600',
    secondaryColor: '#2C7A2C',
    neonColor: '#ff6600',
    laneIndex: 1, // Naranja neón
    avatar: '🔥',
    soundName: 'bowser',
  },
  toad: {
    id: 'toad',
    name: 'Toad',
    color: '#FFEE00',
    secondaryColor: '#0033AA',
    neonColor: '#ffee00',
    laneIndex: 2, // Amarillo neón
    avatar: '🍄',
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
    name: 'Peach',
    color: '#E056FD',
    secondaryColor: '#FFD700',
    neonColor: '#9900ff',
    laneIndex: 5, // Violeta neón
    avatar: '👑',
    soundName: 'peach',
  },
};

export const CHARACTER_LIST: Character[] = Object.values(CHARACTERS);

export const DEFAULT_TEAM_MEMBERS = [
  { name: 'Alex', role: 'Front', characterId: 'mario' as CharacterId },
  { name: 'Sofía', role: 'Back', characterId: 'luigi' as CharacterId },
  { name: 'Mateo', role: 'QA', characterId: 'peach' as CharacterId },
  { name: 'Lucía', role: 'UX', characterId: 'yoshi' as CharacterId },
  { name: 'Carlos', role: 'DevOps', characterId: 'bowser' as CharacterId },
  { name: 'Elena', role: 'PO', characterId: 'toad' as CharacterId },
];
