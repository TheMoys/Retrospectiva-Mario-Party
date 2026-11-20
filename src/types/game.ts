export type CharacterId = 'mario' | 'luigi' | 'peach' | 'yoshi' | 'bowser' | 'toad';

export interface Character {
  id: CharacterId;
  name: string;
  color: string;
  secondaryColor: string;
  neonColor: string;
  laneIndex: number; // 0 to 5 for rainbow lanes
  avatar: string;
  soundName?: string;
}

export type PowerUpType = 
  | 'turbo_mushroom' 
  | 'golden_die' 
  | 'boo' 
  | 'banana' 
  | 'shield_star';

export interface PowerUp {
  id: PowerUpType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export type BoardSpaceType = 'start' | 'green' | 'yellow' | 'red' | 'purple';

export interface BoardSpace {
  index: number;
  type: BoardSpaceType;
  title: string;
  label: string;
  description: string;
  colorHex: string;
  neonHex: string;
}

export type RetroCategory = 'seguir' | 'mejorar' | 'dejar';

export interface RetroCard {
  id: string;
  playerId: string;
  playerName: string;
  characterId: CharacterId;
  category: RetroCategory;
  content: string;
  recipientId?: string;
  recipientName?: string;
  timestamp: number;
}

export interface PlayerMedals {
  seguir: boolean;   // 🟢 Casilla verde
  mejorar: boolean;  // 🟡 Casilla amarilla
  dejar: boolean;    // 🔴 Casilla roja
}

export interface Player {
  id: string;
  name: string;
  role?: string; // e.g. Front, Back, QA, UX, DevOps, PO
  characterId: CharacterId;
  stars: number;
  spaceIndex: number;
  lap: number;
  medals: PlayerMedals;
  powerUps: PowerUpType[];
  shieldActive: boolean;
  activeTrapImmunity: boolean;
  isConnected: boolean;
  isHost?: boolean;
}

export interface Trap {
  id: string;
  spaceIndex: number;
  placedByPlayerId: string;
}

export type MinigameType = 'block_smash' | 'quick_vote';

export interface MinigameState {
  active: boolean;
  type: MinigameType;
  title: string;
  phase: 'instructions' | 'countdown' | 'playing' | 'results';
  question?: string;
  endsAt: number;
  countdown: number;
  scores: Record<string, number>; // playerId -> clicks
  votes: Record<string, string>;   // voterPlayerId -> votedForPlayerId
  winnerPlayerId?: string;
}

export type GamePhase = 
  | 'lobby'
  | 'turn_start'
  | 'rolling'
  | 'moving'
  | 'space_action'
  | 'roulette'
  | 'chaos_event'
  | 'minigame'
  | 'peaje'
  | 'bonus_stars'
  | 'podium';

export interface MovementState {
  playerId: string;
  fromSpace: number;
  toSpace: number;
  currentSpace: number;
  stepIndex: number;
  totalSteps: number;
  startTime?: number;
  durationMs?: number;
}

export interface TargetRouletteState {
  active: boolean;
  spinning: boolean;
  category: RetroCategory;
  selectedPlayerId?: string;
  selectedPlayerName?: string;
  selectedCharacterId?: CharacterId;
  isWildcard: boolean;
  availableCategories?: RetroCategory[];
}

export type ChaosEventType = 
  | 'double_kudo' 
  | 'swap_pos' 
  | 'steal_star' 
  | 'item_box' 
  | 'speed_challenge';

export interface ChaosEventState {
  active: boolean;
  spinning: boolean;
  eventType?: ChaosEventType;
  title: string;
  description: string;
  resolved: boolean;
}

export type BonusStarType = 'critico' | 'robo' | 'reconocimiento';

export interface BonusStarWheelState {
  active: boolean;
  spinning: boolean;
  playerId: string;
  playerName: string;
  starType?: BonusStarType;
  targetPlayerId?: string;
  resolved: boolean;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  activePlayerIndex: number;
  diceRoll: number[]; // e.g. [4] or [3, 5] if double mushroom
  currentTurn: number; // 1 to 24 (4 rounds x 6 players)
  maxTurns: number; // 24
  round: number; // 1 to 4
  totalRounds: number; // 4
  boardSpaces: BoardSpace[];
  traps: Trap[];
  retroCards: RetroCard[];
  minigame: MinigameState | null;
  movement: MovementState | null;
  targetRoulette: TargetRouletteState | null;
  chaosEvent: ChaosEventState | null;
  bonusStarWheel: BonusStarWheelState | null;
  activeMessage?: string;
  starLeaderId?: string;
  bonusStarsAwarded?: boolean;
  seenMinigames?: Record<string, boolean>;
}

// Network message contracts for Jackbox-style real-time sync
export type NetworkAction =
  | { type: 'JOIN_ROOM'; player: { id?: string; name: string; characterId: CharacterId; role?: string } }
  | { type: 'REQUEST_SYNC' }
  | { type: 'PEER_CONNECTED'; peerId: string }
  | { type: 'SYNC_STATE'; state: GameState }
  | { type: 'SET_TOTAL_ROUNDS'; rounds: number }
  | { type: 'START_MINIGAME_ACTION' }
  | { type: 'ROLL_DICE'; playerId: string }
  | { type: 'USE_POWERUP'; playerId: string; powerUp: PowerUpType; targetPlayerId?: string }
  | { type: 'SUBMIT_RETRO_CARD'; card: Omit<RetroCard, 'id' | 'timestamp'> }
  | { type: 'SUBMIT_MINIGAME_TAP'; playerId: string }
  | { type: 'SUBMIT_MINIGAME_VOTE'; voterId: string; targetId: string }
  | { type: 'NEXT_TURN' }
  | { type: 'TRIGGER_MINIGAME'; minigameType: MinigameType }
  | { type: 'RESOLVE_ROULETTE'; targetId: string }
  | { type: 'RESOLVE_CHAOS_EVENT'; eventType: ChaosEventType }
  | { type: 'RESOLVE_BONUS_STAR'; playerId: string; starType: BonusStarType; targetPlayerId?: string }
  | { type: 'ENTER_PEAJE' }
  | { type: 'ENTER_BONUS_STARS' }
  | { type: 'ENTER_PODIUM' }
  | { type: 'RESET_GAME' };
