import { PowerUp, PowerUpType } from '@/types/game';

export const POWER_UPS: Record<PowerUpType, PowerUp> = {
  turbo_mushroom: {
    id: 'turbo_mushroom',
    name: 'Champiñón Turbo',
    icon: '🍄',
    color: '#E52521',
    description: '¡Doble dado 3D! Lanza 2 dados simultáneos para avanzar entre 2 y 12 casillas.',
  },
  golden_die: {
    id: 'golden_die',
    name: 'Dado Dorado',
    icon: '🎲',
    color: '#FBD100',
    description: 'Dado cargado de la suerte: garantiza sacar un valor alto (4, 5 o 6).',
  },
  boo: {
    id: 'boo',
    name: 'Fantasma Boo',
    icon: '👻',
    color: '#E2E8F0',
    description: 'Envía a Boo hacia un rival a tu elección para robarle 1 Estrella dorada.',
  },
  banana: {
    id: 'banana',
    name: 'Cáscara de Plátano',
    icon: '🍌',
    color: '#F59E0B',
    description: 'Deja una trampa resbaladiza en tu casilla. Quien pase por encima frenará en seco y perderá el turno.',
  },
  shield_star: {
    id: 'shield_star',
    name: 'Estrella Escudo',
    icon: '🛡️',
    color: '#38BDF8',
    description: 'Aura protectora brillante que te vuelve inmune a robos de Boo y trampas de plátano durante una vuelta.',
  },
};

export const POWER_UP_LIST: PowerUp[] = Object.values(POWER_UPS);

export function getRandomPowerUp(): PowerUpType {
  const types: PowerUpType[] = ['turbo_mushroom', 'golden_die', 'boo', 'banana', 'shield_star'];
  const randomIndex = Math.floor(Math.random() * types.length);
  return types[randomIndex];
}
