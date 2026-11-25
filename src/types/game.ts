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
  goldenDieActive?: boolean;
  activeTrapImmunity: boolean;
  isConnected: boolean;
  isHost?: boolean;
}

export interface Trap {
  id: string;
  spaceIndex: number;
  placedByPlayerId: string;
}

export type MinigameType =
  | 'block_smash'
  | 'quick_vote'
  | 'blind_timer'
  | 'planning_poker'
  | 'simon_pipeline'
  | 'defuse_p0'
  | 'chicken_meeting'
  | 'dev_price_is_right'
  | 'sprint_rhythm'
  | 'stroop_bug';

export type MinigamePhase = 'roulette' | 'instructions' | 'countdown' | 'playing' | 'results';

export type PipelineStepId = 'code' | 'test' | 'deploy' | 'hotfix';

export type CableColorId = 'red' | 'blue' | 'green' | 'yellow';

export interface DefuseRoundConfig {
  bombCable: CableColorId;
  pointsByCable: Record<CableColorId, number>;
}

export interface MeetingExitEntry {
  exitedAtMs: number;
  points: number;
  crashed: boolean;
}

export interface PriceIsRightQuestion {
  id: string;
  question: string;
  answer: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export type RhythmLane = 0 | 1 | 2;

export interface RhythmNote {
  id: number;
  lane: RhythmLane;
  timeMs: number;
  freq: number;
}

export interface RhythmEntry {
  score: number;
  hits: number;
  maxCombo: number;
  misses: number;
}

export type StroopColorId = 'red' | 'blue' | 'green' | 'yellow';

export interface StroopPrompt {
  wordColor: StroopColorId;
  inkColor: StroopColorId;
  rule: 'ink' | 'word';
}

export interface StroopEntry {
  correct: number;
  wrong: number;
  totalTimeMs: number;
  finished: boolean;
}

export interface BlindTimerEntry {
  elapsedMs: number;
  errorMs: number;
}

export interface SimonPipelineEntry {
  completedRounds: number;
  correctSteps: number;
  failed: boolean;
  finishedAtMs?: number;
}

export interface MinigameState {
  active: boolean;
  type: MinigameType;
  title: string;
  phase: MinigamePhase;
  question?: string;
  endsAt: number;
  countdown: number;
  scores: Record<string, number>; // playerId -> clicks
  votes: Record<string, string>;   // voterPlayerId -> votedForPlayerId
  targetMs?: number;
  hideAfterMs?: number;
  blindEntries?: Record<string, BlindTimerEntry>;
  pokerBids?: Record<string, number>;
  pipelineSequence?: PipelineStepId[];
  simonEntries?: Record<string, SimonPipelineEntry>;
  defuseRounds?: DefuseRoundConfig[];
  defuseRoundIndex?: number;
  defuseRoundRevealing?: boolean;
  defuseRoundEndsAt?: number;
  defuseChoices?: Record<string, Partial<Record<number, CableColorId>>>;
  meetingCrashAtMs?: number;
  meetingStartedAt?: number;
  meetingCrashed?: boolean;
  meetingExits?: Record<string, MeetingExitEntry>;
  priceQuestion?: PriceIsRightQuestion;
  priceGuesses?: Record<string, number>;
  rhythmNotes?: RhythmNote[];
  rhythmEntries?: Record<string, RhythmEntry>;
  stroopPrompts?: StroopPrompt[];
  stroopEntries?: Record<string, StroopEntry>;
  resultSummary?: string;
  winnerPlayerId?: string;
  winnerPlayerIds?: string[];
  advanceTurnOnClose?: boolean;
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
  isDoubleKudo?: boolean;
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
  lastMinigameType?: MinigameType;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';
export type JoinStatus = 'idle' | 'joining' | 'confirmed' | 'error';

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
  | { type: 'SUBMIT_PEAJE_CARD'; card: Omit<RetroCard, 'id' | 'timestamp'> }
  | { type: 'SUBMIT_MINIGAME_TAP'; playerId: string; count?: number }
  | { type: 'SUBMIT_MINIGAME_VOTE'; voterId: string; targetId: string }
  | { type: 'SUBMIT_BLIND_TIMER'; playerId: string; elapsedMs: number }
  | { type: 'SUBMIT_POKER_BID'; playerId: string; cardValue: number }
  | {
      type: 'SUBMIT_SIMON_PROGRESS';
      playerId: string;
      completedRounds: number;
      correctSteps: number;
      failed: boolean;
      finishedAtMs?: number;
    }
  | { type: 'SUBMIT_DEFUSE_CHOICE'; playerId: string; roundIndex: number; cable: CableColorId }
  | { type: 'SUBMIT_MEETING_EXIT'; playerId: string; elapsedMs: number }
  | { type: 'SUBMIT_PRICE_GUESS'; playerId: string; value: number }
  | {
      type: 'SUBMIT_RHYTHM_SCORE';
      playerId: string;
      score: number;
      hits: number;
      maxCombo: number;
      misses: number;
    }
  | {
      type: 'SUBMIT_STROOP_PROGRESS';
      playerId: string;
      correct: number;
      wrong: number;
      totalTimeMs: number;
      finished: boolean;
    }
  | { type: 'NEXT_TURN' }
  | { type: 'TRIGGER_MINIGAME'; minigameType: MinigameType; advanceTurnOnClose?: boolean }
  | { type: 'TRIGGER_MINIGAME_ROULETTE'; advanceTurnOnClose?: boolean }
  | { type: 'FINISH_MINIGAME_ROULETTE' }
  | { type: 'CLOSE_MINIGAME_RESULTS' }
  | { type: 'RESOLVE_ROULETTE'; targetId: string }
  | { type: 'RESOLVE_CHAOS_EVENT'; eventType: ChaosEventType }
  | { type: 'RESOLVE_BONUS_STAR'; playerId: string; starType: BonusStarType; targetPlayerId?: string }
  | { type: 'ENTER_PEAJE' }
  | { type: 'ENTER_BONUS_STARS' }
  | { type: 'ENTER_PODIUM' }
  | { type: 'RESET_GAME' };
