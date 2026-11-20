import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GameState,
  Player,
  CharacterId,
  PowerUpType,
  RetroCard,
  RetroCategory,
  MinigameType,
  MinigameState,
  GamePhase,
  Trap,
  ChaosEventType,
  BonusStarType,
} from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { CHARACTERS, DEFAULT_TEAM_MEMBERS } from '@/constants/characters';
import { getRandomPowerUp } from '@/constants/powerUps';
import { getRandomVoteQuestion } from '@/constants/minigames';
import { sounds } from '@/audio/soundEffects';
import { network } from '@/services/network';

interface GameContextType {
  gameState: GameState;
  myPlayerId: string;
  setMyPlayerId: (id: string) => void;
  isHost: boolean;
  setIsHost: (isHost: boolean) => void;
  // Game Actions
  createRoom: (code?: string) => string;
  setTotalRounds: (rounds: number) => void;
  joinPlayer: (name: string, characterId: CharacterId, role?: string, existingId?: string) => Player;
  startGame: () => void;
  rollDice: (playerId?: string) => void;
  usePowerUp: (playerId: string, powerUp: PowerUpType, targetPlayerId?: string) => void;
  resolveRoulette: (targetPlayerId: string) => void;
  resolveChaosEvent: (eventType: ChaosEventType) => void;
  submitRetroCard: (card: Omit<RetroCard, 'id' | 'timestamp'>) => void;
  triggerMinigame: (type: MinigameType) => void;
  startMinigamePlay: () => void;
  submitMinigameTap: (playerId: string) => void;
  submitMinigameVote: (voterId: string, targetId: string) => void;
  finishMinigame: () => void;
  enterPeaje: () => void;
  submitPeajeCard: (card: Omit<RetroCard, 'id' | 'timestamp'>) => void;
  spinBonusStar: (playerId: string) => void;
  enterPodium: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Generate 4-letter room code (e.g. STAR, DADO, KART)
export function generateRoomCode(): string {
  const words = ['STAR', 'KART', 'DADO', 'TOAD', 'BOOO', 'YOSH', 'COIN', 'LUNA', 'WARP'];
  return words[Math.floor(Math.random() * words.length)];
}

// Generate the 6 official participants matching the Mario Party screenshot
export const createInitialPlayers = (): Player[] => {
  return DEFAULT_TEAM_MEMBERS.map((m, idx) => ({
    id: `player-${idx + 1}`,
    name: m.name,
    role: m.role,
    characterId: m.characterId,
    stars: 1, // Start with 1 star as in Mario Party reference
    spaceIndex: 0,
    lap: 1,
    medals: { seguir: false, mejorar: false, dejar: false },
    powerUps: [idx === 0 ? 'shield_star' : getRandomPowerUp()],
    shieldActive: idx === 0,
    activeTrapImmunity: false,
    isConnected: true,
  }));
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(true);

  const [gameState, setGameState] = useState<GameState>(() => ({
    roomCode: 'STAR',
    phase: 'lobby',
    players: [],
    activePlayerIndex: 0,
    diceRoll: [1],
    currentTurn: 1,
    maxTurns: 24, // 4 rounds x 6 players = 24 turns
    round: 1,
    totalRounds: 4,
    boardSpaces: BOARD_SPACES,
    traps: [],
    retroCards: [],
    minigame: null,
    movement: null,
    targetRoulette: null,
    chaosEvent: null,
    bonusStarWheel: null,
    activeMessage: 'Esperando a que los jugadores se unan con su móvil...',
    starLeaderId: undefined,
    bonusStarsAwarded: false,
    seenMinigames: {},
  }));

  const activeMovementTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync state broadcast if host
  const updateAndBroadcastState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      // Determine current star leader
      let maxStars = -1;
      let leaderId: string | undefined = undefined;
      next.players.forEach((p) => {
        if (p.stars > maxStars) {
          maxStars = p.stars;
          leaderId = p.id;
        }
      });
      next.starLeaderId = maxStars > 0 ? leaderId : undefined;

      // Broadcast if Host
      if (network.isHost) {
        network.broadcastToControllers({ type: 'SYNC_STATE', state: next });
      }
      return next;
    });
  }, []);

  // 1. Create Room (Fresh empty room waiting for mobile players)
  const createRoom = useCallback((code?: string): string => {
    const newCode = code ? code.toUpperCase() : 'STAR';
    updateAndBroadcastState((prev) => ({
      ...prev,
      roomCode: newCode,
      phase: 'lobby',
      players: [],
      currentTurn: 1,
      round: 1,
      activePlayerIndex: 0,
      retroCards: [],
      traps: [],
      activeMessage: 'Esperando a que los jugadores se unan con su móvil...',
    }));
    return newCode;
  }, [updateAndBroadcastState]);

  // 1A. Set Total Rounds (Configurable in lobby before starting)
  const setTotalRounds = useCallback((rounds: number) => {
    const clamped = Math.max(1, Math.min(10, Math.floor(rounds)));
    updateAndBroadcastState((prev) => ({
      ...prev,
      totalRounds: clamped,
      maxTurns: clamped * Math.max(1, prev.players.length),
    }));
  }, [updateAndBroadcastState]);

  // 1B. Start Game (Host activates the board; turn begins!)
  const startGame = useCallback(() => {
    sounds.playStarFanfare();
    updateAndBroadcastState((prev) => {
      if (prev.players.length === 0) return prev;
      const firstPlayer = prev.players[0];
      return {
        ...prev,
        phase: 'turn_start',
        activePlayerIndex: 0,
        currentTurn: 1,
        round: 1,
        maxTurns: prev.totalRounds * prev.players.length,
        activeMessage: `¡Arranca Sprint Party! Turno de ${firstPlayer.name} (${CHARACTERS[firstPlayer.characterId]?.name || ''}).`,
      };
    });
  }, [updateAndBroadcastState]);

  // 2. Join Player
  const joinPlayer = useCallback((name: string, characterId: CharacterId, role?: string, existingId?: string): Player => {
    const newPlayer: Player = {
      id: existingId || `player-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim() || CHARACTERS[characterId].name,
      role: role || 'Dev',
      characterId,
      stars: 1,
      spaceIndex: 0,
      lap: 1,
      medals: { seguir: false, mejorar: false, dejar: false },
      powerUps: [getRandomPowerUp()],
      shieldActive: false,
      activeTrapImmunity: false,
      isConnected: true,
    };

    sounds.playCoin();

    updateAndBroadcastState((prev) => {
      const filtered = prev.players.filter((p) => p.characterId !== characterId);
      const updatedPlayers = [...filtered, newPlayer];

      return {
        ...prev,
        players: updatedPlayers,
        activeMessage: `¡${newPlayer.name} (${CHARACTERS[characterId].name}) se unió al equipo!`,
      };
    });

    return newPlayer;
  }, [updateAndBroadcastState]);

  // Handle Space Landing Logic
  const handleLanding = useCallback((playerId: string, landedIndex: number) => {
    updateAndBroadcastState((prev) => {
      const player = prev.players.find((p) => p.id === playerId);
      if (!player) return prev;

      // Check Banana Trap
      const trapIdx = prev.traps.findIndex((t) => t.spaceIndex === landedIndex);
      if (trapIdx !== -1 && !player.shieldActive) {
        sounds.playSlip();
        const updatedTraps = prev.traps.filter((_, idx) => idx !== trapIdx);
        return {
          ...prev,
          phase: 'turn_start',
          movement: null,
          traps: updatedTraps,
          activeMessage: `🍌 ¡Ouch! ${player.name} resbaló con un plátano en la casilla ${landedIndex}.`,
        };
      }

      const landedSpace = BOARD_SPACES[landedIndex];

      // GREEN or YELLOW: Ruleta de Objetivo
      if (landedSpace.type === 'green' || landedSpace.type === 'yellow') {
        const category: RetroCategory = landedSpace.type === 'green' ? 'seguir' : 'mejorar';
        const alreadyHasMedal = player.medals[category];

        const teammates = prev.players.filter((p) => p.id !== player.id);
        const receivedCountMap: Record<string, number> = {};
        teammates.forEach((t) => {
          receivedCountMap[t.id] = prev.retroCards.filter((c) => c.recipientId === t.id).length;
        });

        // Balanced selection: teammates with fewer received praises
        const sorted = [...teammates].sort((a, b) => (receivedCountMap[a.id] || 0) - (receivedCountMap[b.id] || 0));
        const minCount = receivedCountMap[sorted[0]?.id] || 0;
        const candidates = sorted.filter((t) => (receivedCountMap[t.id] || 0) <= minCount + 1);
        const chosen = candidates[Math.floor(Math.random() * candidates.length)] || teammates[0];

        sounds.playCoin();

        return {
          ...prev,
          movement: null,
          phase: 'roulette',
          targetRoulette: {
            active: true,
            spinning: true,
            category,
            selectedPlayerId: chosen.id,
            selectedPlayerName: chosen.name,
            selectedCharacterId: chosen.characterId,
            isWildcard: alreadyHasMedal,
            availableCategories: alreadyHasMedal
              ? (['seguir', 'mejorar', 'dejar'] as RetroCategory[]).filter((c) => !player.medals[c])
              : undefined,
          },
          activeMessage: `🎯 ¡Ruleta de Objetivo activada para ${player.name}! Girando para seleccionar compañero...`,
        };
      }

      // RED: Dejar de Hacer (Al equipo / proceso)
      if (landedSpace.type === 'red') {
        sounds.playCoin();
        const alreadyHasMedal = player.medals.dejar;

        return {
          ...prev,
          movement: null,
          phase: 'space_action',
          targetRoulette: {
            active: true,
            spinning: false,
            category: 'dejar',
            isWildcard: alreadyHasMedal,
            availableCategories: alreadyHasMedal
              ? (['seguir', 'mejorar', 'dejar'] as RetroCategory[]).filter((c) => !player.medals[c])
              : undefined,
          },
          activeMessage: `🔴 ¡Casilla Roja! ${player.name} aportará una mejora al flujo del equipo.`,
        };
      }

      // PURPLE: Evento Caos y Kudos
      if (landedSpace.type === 'purple') {
        sounds.playCoin();
        const events: Array<{ type: ChaosEventType; title: string; desc: string }> = [
          { type: 'double_kudo', title: '🎁 Kudo Doble', desc: '¡Escribe un elogio con ruleta y ambos ganan +2 Estrellas!' },
          { type: 'item_box', title: '🎒 Caja de Power-Up', desc: '¡Recibes un objeto sorpresa para tu mochila!' },
          { type: 'steal_star', title: '🦹 Robo de la Suerte', desc: '¡Le quitas 1 estrella al rival con más estrellas!' },
          { type: 'swap_pos', title: '🌪️ Intercambio de Posición', desc: '¡Intercambias casilla con otro jugador al azar!' },
          { type: 'speed_challenge', title: '⚡ Reto Express 15s', desc: '¡Minijuego sorpresa para todo el equipo!' },
        ];
        const chosenEvent = events[Math.floor(Math.random() * events.length)];

        // Grant power-up if item box
        const updatedPlayers = prev.players.map((p) => {
          if (p.id !== player.id) return p;
          if (chosenEvent.type === 'item_box' && p.powerUps.length < 2) {
            return { ...p, powerUps: [...p.powerUps, getRandomPowerUp()] };
          }
          return p;
        });

        return {
          ...prev,
          players: updatedPlayers,
          movement: null,
          phase: 'chaos_event',
          chaosEvent: {
            active: true,
            spinning: true,
            eventType: chosenEvent.type,
            title: chosenEvent.title,
            description: chosenEvent.desc,
            resolved: false,
          },
          activeMessage: `🟣 ¡Casilla Caos! Sorteando evento sorpresa para ${player.name}...`,
        };
      }

      // START SPACE
      return {
        ...prev,
        movement: null,
        phase: 'turn_start',
        activeMessage: `🏁 ¡${player.name} pasa por la Salida! Siguiente turno listo.`,
      };
    });
  }, [updateAndBroadcastState]);

  // 3. Roll Dice & Step-by-Step Movement
  const rollDice = useCallback((playerId?: string) => {
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const targetId = playerId || activePlayer?.id;
    if (!activePlayer || activePlayer.id !== targetId) return;
    if (gameState.phase !== 'turn_start' && gameState.phase !== 'space_action') return;

    sounds.playDiceTumble();

    const hasTurbo = gameState.diceRoll.length === 2;
    let roll1 = Math.floor(Math.random() * 6) + 1;
    let roll2 = Math.floor(Math.random() * 6) + 1;

    // Golden die guarantee 4, 5, or 6
    if (activePlayer.powerUps.includes('golden_die')) {
      roll1 = Math.floor(Math.random() * 3) + 4;
    }

    const currentRolls = hasTurbo ? [roll1, roll2] : [roll1];
    const totalSteps = currentRolls.reduce((a, b) => a + b, 0);

    // 1. Enter rolling phase
    updateAndBroadcastState((prev) => ({
      ...prev,
      phase: 'rolling',
      diceRoll: currentRolls,
      activeMessage: `🎲 ¡${activePlayer.name} tira el dado y saca un ${totalSteps}!`,
    }));

    // 2. Animate smooth continuous spline movement
    setTimeout(() => {
      const startTime = Date.now();
      const durationMs = totalSteps * 450;
      const finalSpace = (activePlayer.spaceIndex + totalSteps) % 20;
      const completedLaps = Math.floor((activePlayer.spaceIndex + totalSteps) / 20);

      updateAndBroadcastState((prev) => ({
        ...prev,
        phase: 'moving',
        movement: {
          playerId: activePlayer.id,
          fromSpace: activePlayer.spaceIndex,
          toSpace: finalSpace,
          currentSpace: activePlayer.spaceIndex,
          stepIndex: 0,
          totalSteps,
          startTime,
          durationMs,
        },
        activeMessage: `🏃 ¡${activePlayer.name} avanza con fluidez por la Senda Arcoíris (${totalSteps} casillas)!`,
      }));

      if (activeMovementTimer.current) clearTimeout(activeMovementTimer.current);

      activeMovementTimer.current = setTimeout(() => {
        // Finalize player position and lap progress
        updateAndBroadcastState((prev) => {
          const updatedPlayers = prev.players.map((p) => {
            if (p.id !== activePlayer.id) return p;
            return {
              ...p,
              spaceIndex: finalSpace,
              lap: p.lap + completedLaps,
              stars: p.stars + completedLaps,
            };
          });

          return {
            ...prev,
            players: updatedPlayers,
          };
        });

        // Trigger space action at destination
        setTimeout(() => {
          handleLanding(activePlayer.id, finalSpace);
        }, 300);
      }, durationMs + 100);
    }, 850);
  }, [gameState.players, gameState.activePlayerIndex, gameState.phase, gameState.diceRoll, updateAndBroadcastState, handleLanding]);

  // 4. Resolve Target Roulette
  const resolveRoulette = useCallback((targetPlayerId: string) => {
    updateAndBroadcastState((prev) => {
      if (!prev.targetRoulette) return prev;
      const target = prev.players.find((p) => p.id === targetPlayerId);
      sounds.playCoin();

      return {
        ...prev,
        phase: 'space_action',
        targetRoulette: {
          ...prev.targetRoulette,
          spinning: false,
          selectedPlayerId: target?.id,
          selectedPlayerName: target?.name,
          selectedCharacterId: target?.characterId,
        },
      };
    });
  }, [updateAndBroadcastState]);

  // 5. Resolve Chaos Event
  const resolveChaosEvent = useCallback((eventType: ChaosEventType) => {
    updateAndBroadcastState((prev) => {
      const activePlayer = prev.players[prev.activePlayerIndex];
      let updatedPlayers = [...prev.players];
      let msg = '';

      if (eventType === 'swap_pos') {
        const others = updatedPlayers.filter((p) => p.id !== activePlayer.id);
        const randomTarget = others[Math.floor(Math.random() * others.length)];
        if (randomTarget) {
          const tempSpace = activePlayer.spaceIndex;
          activePlayer.spaceIndex = randomTarget.spaceIndex;
          randomTarget.spaceIndex = tempSpace;
          msg = `🌪️ ¡${activePlayer.name} intercambió casilla con ${randomTarget.name}!`;
        }
      } else if (eventType === 'steal_star') {
        const sorted = [...updatedPlayers].filter((p) => p.id !== activePlayer.id).sort((a, b) => b.stars - a.stars);
        const victim = sorted[0];
        if (victim && victim.stars > 0 && !victim.shieldActive) {
          victim.stars -= 1;
          activePlayer.stars += 1;
          msg = `🦹 ¡${activePlayer.name} le robó 1 estrella a ${victim.name}!`;
        } else {
          msg = `🛡️ ¡El robo de estrella fue bloqueado por escudo o falta de estrellas!`;
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
        phase: 'turn_start',
        chaosEvent: null,
        activeMessage: msg || '¡Evento Caos resuelto con éxito!',
      };
    });
  }, [updateAndBroadcastState]);

  // 6. Submit Retro Card
  const submitRetroCard = useCallback((cardData: Omit<RetroCard, 'id' | 'timestamp'>) => {
    sounds.playStarFanfare();

    const newCard: RetroCard = {
      ...cardData,
      id: `card-${Date.now()}`,
      timestamp: Date.now(),
    };

    updateAndBroadcastState((prev) => {
      const updatedPlayers = prev.players.map((p) => {
        // Author earns +1 Star and unlocks medal
        if (p.id === cardData.playerId) {
          return {
            ...p,
            stars: p.stars + 1,
            medals: {
              ...p.medals,
              [cardData.category]: true,
            },
          };
        }
        // Recipient of praise in 'seguir' earns +1 Star as well!
        if (cardData.category === 'seguir' && cardData.recipientId && p.id === cardData.recipientId) {
          return {
            ...p,
            stars: p.stars + 1,
          };
        }
        return p;
      });

      const nextIdx = (prev.activePlayerIndex + 1) % prev.players.length;
      const nextTurnNumber = prev.currentTurn + 1;
      const newRound = Math.min(prev.totalRounds, Math.floor((nextTurnNumber - 1) / Math.max(1, prev.players.length)) + 1);

      // Check if all configured rounds are completed
      const allRoundsCompleted = nextTurnNumber > prev.players.length * prev.totalRounds;

      if (allRoundsCompleted) {
        const anyMissingMedals = updatedPlayers.some(
          (p) => !p.medals.seguir || !p.medals.mejorar || !p.medals.dejar
        );

        return {
          ...prev,
          retroCards: [newCard, ...prev.retroCards],
          players: updatedPlayers,
          targetRoulette: null,
          chaosEvent: null,
          phase: anyMissingMedals ? 'peaje' : 'bonus_stars',
          activeMessage: anyMissingMedals
            ? '🚧 ¡FASE DE EL PEAJE! Nadie se va sin aportar. Completa tus medallas pendientes.'
            : '🌟 ¡FASE DE BONUS STARS! Quienes tienen sus 3 medallas giran la ruleta de bonificación final.',
        };
      }

      // Check if a full round of players ended
      const roundJustEnded = nextIdx === 0;
      const autoMinigameType = newRound % 2 === 0 ? 'block_smash' : 'quick_vote';
      const autoHasSeen = !!prev.seenMinigames?.[autoMinigameType];

      return {
        ...prev,
        retroCards: [newCard, ...prev.retroCards],
        players: updatedPlayers,
        activePlayerIndex: nextIdx,
        currentTurn: nextTurnNumber,
        round: newRound,
        phase: roundJustEnded ? 'minigame' : 'turn_start',
        seenMinigames: roundJustEnded ? { ...(prev.seenMinigames || {}), [autoMinigameType]: true } : prev.seenMinigames,
        minigame: roundJustEnded
          ? {
              active: true,
              type: autoMinigameType,
              phase: autoHasSeen ? 'countdown' : 'instructions',
              title: autoMinigameType === 'block_smash' ? '⚡ ¡Machaca el Bloque ?!' : '🗳️ ¿Quién del equipo...?',
              question: getRandomVoteQuestion().question,
              endsAt: Date.now() + 8000,
              countdown: 8,
              scores: {},
              votes: {},
            }
          : null,
        targetRoulette: null,
        chaosEvent: null,
        activeMessage: roundJustEnded
          ? '⚡ ¡Fin de ronda! ¡MINIJUEGO EXPRESS AUTOMÁTICO!'
          : `Turno de ${updatedPlayers[nextIdx]?.name}. ¡Lanza el dado!`,
      };
    });
  }, [updateAndBroadcastState]);

  // 7. Use Power-Up
  const usePowerUp = useCallback((playerId: string, powerUp: PowerUpType, targetPlayerId?: string) => {
    updateAndBroadcastState((prev) => {
      const playerIndex = prev.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return prev;
      const player = prev.players[playerIndex];

      const pIdx = player.powerUps.indexOf(powerUp);
      if (pIdx === -1) return prev;
      const updatedPups = [...player.powerUps];
      updatedPups.splice(pIdx, 1);

      let updatedPlayers = [...prev.players];
      let updatedTraps = [...prev.traps];
      let newDiceRoll = [1];
      let msg = '';

      switch (powerUp) {
        case 'turbo_mushroom':
          sounds.playJump();
          newDiceRoll = [1, 1];
          msg = `🍄 ¡${player.name} usó Champiñón Turbo! Tirará 2 dados simultáneos.`;
          break;

        case 'golden_die':
          sounds.playCoin();
          msg = `🎲 ¡${player.name} usó el Dado Dorado! Sacará un 4, 5 o 6.`;
          break;

        case 'boo':
          sounds.playBoo();
          if (targetPlayerId) {
            const target = updatedPlayers.find((p) => p.id === targetPlayerId);
            if (target && !target.shieldActive && target.stars > 0) {
              target.stars -= 1;
              player.stars += 1;
              msg = `👻 ¡Boo le robó 1 Estrella a ${target.name} y se la dio a ${player.name}!`;
            } else if (target?.shieldActive) {
              msg = `🛡️ ¡El escudo de ${target.name} bloqueó el robo de Boo!`;
            } else {
              msg = `👻 ¡Boo no pudo robar porque ${target?.name || 'el rival'} no tiene estrellas!`;
            }
          }
          break;

        case 'banana':
          sounds.playSlip();
          updatedTraps.push({
            id: `trap-${Date.now()}`,
            spaceIndex: player.spaceIndex,
            placedByPlayerId: player.id,
          });
          msg = `🍌 ¡${player.name} colocó una cáscara de plátano en la casilla ${player.spaceIndex}!`;
          break;

        case 'shield_star':
          sounds.playStarFanfare();
          player.shieldActive = true;
          msg = `🛡️ ¡${player.name} activó la Estrella Escudo! Inmune a trampas y robos.`;
          break;
      }

      updatedPlayers[playerIndex] = {
        ...player,
        powerUps: updatedPups,
      };

      return {
        ...prev,
        players: updatedPlayers,
        traps: updatedTraps,
        diceRoll: newDiceRoll.length === 2 ? newDiceRoll : prev.diceRoll,
        activeMessage: msg,
      };
    });
  }, [updateAndBroadcastState]);

  // 8. Submit Peaje Card
  const submitPeajeCard = useCallback((cardData: Omit<RetroCard, 'id' | 'timestamp'>) => {
    sounds.playStarFanfare();
    const newCard: RetroCard = {
      ...cardData,
      id: `card-${Date.now()}`,
      timestamp: Date.now(),
    };

    updateAndBroadcastState((prev) => {
      const updatedPlayers = prev.players.map((p) => {
        if (p.id === cardData.playerId) {
          return {
            ...p,
            stars: p.stars + 1,
            medals: {
              ...p.medals,
              [cardData.category]: true,
            },
          };
        }
        return p;
      });

      const anyMissing = updatedPlayers.some((p) => !p.medals.seguir || !p.medals.mejorar || !p.medals.dejar);

      return {
        ...prev,
        retroCards: [newCard, ...prev.retroCards],
        players: updatedPlayers,
        phase: anyMissing ? 'peaje' : 'bonus_stars',
        activeMessage: anyMissing
          ? `⭐ ¡${cardData.playerName} aportó en El Peaje! Quedan compañeros completando sus medallas.`
          : '🌟 ¡Todos los jugadores completaron sus medallas! ¡Pasamos a Bonus Stars!',
      };
    });
  }, [updateAndBroadcastState]);

  // 9. Spin Bonus Star
  const spinBonusStar = useCallback((playerId: string) => {
    sounds.playStarFanfare();
    const starTypes: BonusStarType[] = ['critico', 'robo', 'reconocimiento'];
    const chosenType = starTypes[Math.floor(Math.random() * starTypes.length)];

    updateAndBroadcastState((prev) => {
      const player = prev.players.find((p) => p.id === playerId);
      if (!player) return prev;

      let msg = '';
      if (chosenType === 'critico') {
        player.stars += 2;
        msg = `⭐ ¡${player.name} ganó la Estrella del Crítico (+2 Estrellas)!`;
      } else if (chosenType === 'robo') {
        const sorted = [...prev.players].sort((a, b) => b.stars - a.stars);
        const victim = sorted[0].id === player.id ? sorted[1] : sorted[0];
        if (victim && victim.stars > 0) {
          victim.stars -= 1;
          player.stars += 1;
          msg = `🦹 ¡${player.name} obtuvo la Estrella del Robo y le quitó 1 estrella a ${victim.name}!`;
        } else {
          player.stars += 1;
          msg = `🦹 ¡${player.name} ganó la Estrella del Robo (+1 Estrella)!`;
        }
      } else {
        const others = prev.players.filter((p) => p.id !== player.id);
        const friend = others[Math.floor(Math.random() * others.length)];
        if (friend) {
          friend.stars += 2;
          msg = `🤝 ¡${player.name} otorgó la Estrella del Reconocimiento (+2 Estrellas) a ${friend.name}!`;
        }
      }

      return {
        ...prev,
        activeMessage: msg,
        bonusStarWheel: {
          active: true,
          spinning: false,
          playerId,
          playerName: player.name,
          starType: chosenType,
          resolved: true,
        },
      };
    });
  }, [updateAndBroadcastState]);

  // 10. Next Turn / Manual Advance
  const nextTurn = useCallback(() => {
    updateAndBroadcastState((prev) => {
      if (prev.players.length === 0) return prev;
      const nextIdx = (prev.activePlayerIndex + 1) % prev.players.length;
      const nextPlayer = prev.players[nextIdx];

      return {
        ...prev,
        activePlayerIndex: nextIdx,
        phase: 'turn_start',
        diceRoll: [1],
        targetRoulette: null,
        chaosEvent: null,
        movement: null,
        activeMessage: `Turno de ${nextPlayer?.name || 'Siguiente jugador'}. ¡Lanza el dado!`,
      };
    });
  }, [updateAndBroadcastState]);

  // Minigame Triggers & Actions
  const triggerMinigame = useCallback((type: MinigameType) => {
    sounds.playJump();
    updateAndBroadcastState((prev) => {
      const alreadySeen = !!prev.seenMinigames?.[type];
      const initialPhase: 'instructions' | 'countdown' = alreadySeen ? 'countdown' : 'instructions';
      const duration = type === 'block_smash' ? 8000 : 12000;
      const endsAt = Date.now() + (initialPhase === 'instructions' ? 999999 : 3000 + duration);

      const minigameState: MinigameState = {
        active: true,
        type,
        title: type === 'block_smash' ? '⚡ ¡Machaca el Bloque ?!' : '🗳️ ¿Quién del equipo...?',
        phase: initialPhase,
        question: type === 'quick_vote' ? getRandomVoteQuestion().question : undefined,
        endsAt,
        countdown: initialPhase === 'instructions' ? 10 : 3,
        scores: {},
        votes: {},
      };

      const nextSeen = { ...(prev.seenMinigames || {}), [type]: true };

      return {
        ...prev,
        phase: 'minigame',
        minigame: minigameState,
        seenMinigames: nextSeen,
        activeMessage: `¡MINIJUEGO: ${minigameState.title}!`,
      };
    });
  }, [updateAndBroadcastState]);

  const startMinigamePlay = useCallback(() => {
    sounds.playCoin();
    updateAndBroadcastState((prev) => {
      if (!prev.minigame) return prev;
      const duration = prev.minigame.type === 'block_smash' ? 8000 : 12000;
      return {
        ...prev,
        minigame: {
          ...prev.minigame,
          phase: 'countdown',
          countdown: 3,
          endsAt: Date.now() + 3000 + duration,
        },
      };
    });
  }, [updateAndBroadcastState]);

  const submitMinigameTap = useCallback((playerId: string) => {
    sounds.playSmash();
    updateAndBroadcastState((prev) => {
      if (!prev.minigame || prev.minigame.type !== 'block_smash') return prev;
      const currentScore = prev.minigame.scores[playerId] || 0;
      return {
        ...prev,
        minigame: {
          ...prev.minigame,
          scores: { ...prev.minigame.scores, [playerId]: currentScore + 1 },
        },
      };
    });
  }, [updateAndBroadcastState]);

  const submitMinigameVote = useCallback((voterId: string, targetId: string) => {
    sounds.playCoin();
    updateAndBroadcastState((prev) => {
      if (!prev.minigame || prev.minigame.type !== 'quick_vote') return prev;
      return {
        ...prev,
        minigame: {
          ...prev.minigame,
          votes: { ...prev.minigame.votes, [voterId]: targetId },
        },
      };
    });
  }, [updateAndBroadcastState]);

  const finishMinigame = useCallback(() => {
    updateAndBroadcastState((prev) => {
      if (!prev.minigame) return prev;
      let winnerId: string | undefined = undefined;

      if (prev.minigame.type === 'block_smash') {
        let maxClicks = -1;
        Object.entries(prev.minigame.scores).forEach(([pId, clicks]) => {
          if (clicks > maxClicks) {
            maxClicks = clicks;
            winnerId = pId;
          }
        });
      } else {
        const counts: Record<string, number> = {};
        Object.values(prev.minigame.votes).forEach((vId) => {
          counts[vId] = (counts[vId] || 0) + 1;
        });
        let maxVotes = -1;
        Object.entries(counts).forEach(([vId, votes]) => {
          if (votes > maxVotes) {
            maxVotes = votes;
            winnerId = vId;
          }
        });
      }

      sounds.playStarFanfare();

      const updatedPlayers = prev.players.map((p) => {
        if (p.id === winnerId) {
          return { ...p, stars: p.stars + 2 };
        }
        return p;
      });

      const winnerPlayer = prev.players.find((p) => p.id === winnerId);

      return {
        ...prev,
        phase: 'turn_start',
        minigame: null,
        players: updatedPlayers,
        activeMessage: winnerPlayer
          ? `🏆 ¡${winnerPlayer.name} ganó el Minijuego y se lleva +2 Estrellas!`
          : '¡Minijuego concluido!',
      };
    });
  }, [updateAndBroadcastState]);

  const enterPeaje = useCallback(() => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      phase: 'peaje',
      activeMessage: '🚧 Fase de El Peaje: Todos completan sus 3 medallas.',
    }));
  }, [updateAndBroadcastState]);

  const enterPodium = useCallback(() => {
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    sounds.playVictoryMusic();
    updateAndBroadcastState((prev) => ({
      ...prev,
      phase: 'podium',
      activeMessage: '🏆 ¡FIN DE LA RETROSPECTIVA! Podio de campeones.',
    }));
  }, [updateAndBroadcastState]);

  const resetGame = useCallback(() => {
    updateAndBroadcastState((prev) => ({
      ...prev,
      phase: 'lobby',
      players: [],
      activePlayerIndex: 0,
      currentTurn: 1,
      round: 1,
      retroCards: [],
      traps: [],
      minigame: null,
      movement: null,
      targetRoulette: null,
      chaosEvent: null,
      bonusStarWheel: null,
      activeMessage: 'Esperando a que los jugadores se unan con su móvil...',
    }));
  }, [updateAndBroadcastState]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (activeMovementTimer.current) clearInterval(activeMovementTimer.current);
    };
  }, []);

  // Automatically ensure Host network listener is active on mount
  useEffect(() => {
    if (isHost && gameState.roomCode) {
      network.initHost(gameState.roomCode, (peerId) => {
        console.log('[GAME-CONTEXT] Host network listener ready for room:', gameState.roomCode, 'peerId:', peerId);
      });
    }
  }, [isHost, gameState.roomCode]);

  // Network message listener (Jackbox-style sync between Host and Joy-Phones)
  useEffect(() => {
    const unsubscribe = network.onMessage((action) => {
      if (action.type === 'SYNC_STATE') {
        if (!isHost) {
          setGameState(action.state);
        }
      } else if (isHost) {
        if (action.type === 'PEER_CONNECTED' || action.type === 'REQUEST_SYNC') {
          network.broadcastToControllers({ type: 'SYNC_STATE', state: gameState });
        } else if (action.type === 'JOIN_ROOM') {
          console.log('[GAME-CONTEXT] JOIN_ROOM received on Host for:', action.player.name, action.player.characterId, 'id:', action.player.id);
          joinPlayer(action.player.name, action.player.characterId, action.player.role, action.player.id);
        } else if (action.type === 'SET_TOTAL_ROUNDS') {
          setTotalRounds(action.rounds);
        } else if (action.type === 'START_MINIGAME_ACTION') {
          startMinigamePlay();
        } else if (action.type === 'ROLL_DICE') {
          rollDice(action.playerId);
        } else if (action.type === 'USE_POWERUP') {
          usePowerUp(action.playerId, action.powerUp, action.targetPlayerId);
        } else if (action.type === 'SUBMIT_RETRO_CARD') {
          submitRetroCard(action.card);
        } else if (action.type === 'SUBMIT_MINIGAME_TAP') {
          submitMinigameTap(action.playerId);
        } else if (action.type === 'SUBMIT_MINIGAME_VOTE') {
          submitMinigameVote(action.voterId, action.targetId);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isHost, gameState, joinPlayer, setTotalRounds, startMinigamePlay, rollDice, usePowerUp, submitRetroCard, submitMinigameTap, submitMinigameVote]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        myPlayerId,
        setMyPlayerId,
        isHost,
        setIsHost,
        createRoom,
        setTotalRounds,
        joinPlayer,
        startGame,
        rollDice,
        usePowerUp,
        resolveRoulette,
        resolveChaosEvent,
        submitRetroCard,
        triggerMinigame,
        startMinigamePlay,
        submitMinigameTap,
        submitMinigameVote,
        finishMinigame,
        enterPeaje,
        submitPeajeCard,
        spinBonusStar,
        enterPodium,
        nextTurn,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};