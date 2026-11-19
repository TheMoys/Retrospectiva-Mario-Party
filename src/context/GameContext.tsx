import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  GameState,
  Player,
  CharacterId,
  PowerUpType,
  RetroCard,
  MinigameType,
  MinigameState,
  GamePhase,
  Trap,
} from '@/types/game';
import { BOARD_SPACES } from '@/constants/boardSpaces';
import { CHARACTERS } from '@/constants/characters';
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
  joinPlayer: (name: string, characterId: CharacterId) => Player;
  rollDice: (playerId?: string) => void;
  usePowerUp: (playerId: string, powerUp: PowerUpType, targetPlayerId?: string) => void;
  submitRetroCard: (card: Omit<RetroCard, 'id' | 'timestamp'>) => void;
  triggerMinigame: (type: MinigameType) => void;
  submitMinigameTap: (playerId: string) => void;
  submitMinigameVote: (voterId: string, targetId: string) => void;
  finishMinigame: () => void;
  enterPeaje: () => void;
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

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(true);

  const [gameState, setGameState] = useState<GameState>(() => ({
    roomCode: generateRoomCode(),
    phase: 'lobby',
    players: [],
    activePlayerIndex: 0,
    diceRoll: [1],
    currentTurn: 1,
    maxTurns: 15,
    boardSpaces: BOARD_SPACES,
    traps: [],
    retroCards: [],
    minigame: null,
    activeMessage: '¡Esperando a que los jugadores se unan con el Joy-Phone!',
    starLeaderId: undefined,
    bonusStarsAwarded: false,
  }));

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

  // Listen to network actions
  useEffect(() => {
    const unsub = network.onMessage((action) => {
      switch (action.type) {
        case 'SYNC_STATE':
          setGameState(action.state);
          break;

        case 'JOIN_ROOM':
          if (network.isHost) {
            joinPlayer(action.player.name, action.player.characterId);
          }
          break;

        case 'ROLL_DICE':
          rollDice(action.playerId);
          break;

        case 'USE_POWERUP':
          usePowerUp(action.playerId, action.powerUp, action.targetPlayerId);
          break;

        case 'SUBMIT_RETRO_CARD':
          submitRetroCard(action.card);
          break;

        case 'SUBMIT_MINIGAME_TAP':
          submitMinigameTap(action.playerId);
          break;

        case 'SUBMIT_MINIGAME_VOTE':
          submitMinigameVote(action.voterId, action.targetId);
          break;

        case 'NEXT_TURN':
          nextTurn();
          break;

        case 'TRIGGER_MINIGAME':
          triggerMinigame(action.minigameType);
          break;

        case 'ENTER_PEAJE':
          enterPeaje();
          break;

        case 'ENTER_PODIUM':
          enterPodium();
          break;

        case 'RESET_GAME':
          resetGame();
          break;
      }
    });

    return unsub;
  }, []);

  // 1. Create Room
  const createRoom = useCallback((code?: string): string => {
    const newCode = code ? code.toUpperCase() : generateRoomCode();
    setGameState((prev) => ({
      ...prev,
      roomCode: newCode,
      phase: 'lobby',
      players: [],
      activePlayerIndex: 0,
      retroCards: [],
      traps: [],
    }));
    return newCode;
  }, []);

  // 2. Join Player
  const joinPlayer = useCallback((name: string, characterId: CharacterId): Player => {
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim() || CHARACTERS[characterId].name,
      characterId,
      stars: 0,
      spaceIndex: 0,
      lap: 1,
      medals: { seguir: false, mejorar: false, dejar: false },
      powerUps: [getRandomPowerUp()], // Start with 1 welcome power-up
      shieldActive: false,
      activeTrapImmunity: false,
      isConnected: true,
    };

    sounds.playCoin();

    updateAndBroadcastState((prev) => {
      // If character already chosen, replace or add
      const filtered = prev.players.filter((p) => p.characterId !== characterId);
      const updatedPlayers = [...filtered, newPlayer];

      return {
        ...prev,
        players: updatedPlayers,
        activeMessage: `¡${newPlayer.name} (${CHARACTERS[characterId].name}) se ha unido a la pista!`,
      };
    });

    return newPlayer;
  }, [updateAndBroadcastState]);

  // 3. Roll Dice & Move
  const rollDice = useCallback((playerId?: string) => {
    sounds.playDiceTumble();

    updateAndBroadcastState((prev) => {
      const activePlayer = prev.players[prev.activePlayerIndex];
      const targetId = playerId || activePlayer?.id;
      if (!activePlayer || activePlayer.id !== targetId) return prev;

      // Check if Turbo Mushroom is queued in diceRoll
      const hasTurbo = prev.diceRoll.length === 2;
      let roll1 = Math.floor(Math.random() * 6) + 1;
      let roll2 = Math.floor(Math.random() * 6) + 1;

      // Golden die guarantee 4, 5, 6
      if (activePlayer.powerUps.includes('golden_die')) {
        roll1 = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6
      }

      const currentRolls = hasTurbo ? [roll1, roll2] : [roll1];
      const totalSteps = currentRolls.reduce((a, b) => a + b, 0);

      // Advance Player along 20-space board
      const oldIndex = activePlayer.spaceIndex;
      const newIndex = (oldIndex + totalSteps) % 20;
      const completedLap = oldIndex + totalSteps >= 20;

      // Check for Banana Trap on landing
      const hitTrapIndex = prev.traps.findIndex((t) => t.spaceIndex === newIndex);
      let hitTrap = false;
      let updatedTraps = prev.traps;

      if (hitTrapIndex !== -1 && !activePlayer.shieldActive) {
        hitTrap = true;
        sounds.playSlip();
        updatedTraps = prev.traps.filter((_, idx) => idx !== hitTrapIndex);
      }

      // Space Type Action
      const landedSpace = BOARD_SPACES[newIndex];
      let msg = `¡${activePlayer.name} ha sacado un ${totalSteps}!`;

      if (hitTrap) {
        msg = `¡Ouch! ${activePlayer.name} ha resbalado con una cáscara de plátano en la casilla ${newIndex}.`;
      } else if (landedSpace.type === 'purple') {
        sounds.playCoin();
        msg = `¡Casilla Caos! ${activePlayer.name} recibe una sorpresa.`;
      } else if (landedSpace.type === 'start') {
        sounds.playStarFanfare();
        msg = `¡${activePlayer.name} cruza la Meta Salida y gana +1 Estrella extra!`;
      }

      // Update player
      const updatedPlayers = prev.players.map((p, idx) => {
        if (idx !== prev.activePlayerIndex) return p;
        let newStars = p.stars;
        if (landedSpace.type === 'start') newStars += 1;

        // Auto grant power up on purple space
        let newPowerUps = [...p.powerUps];
        if (landedSpace.type === 'purple' && newPowerUps.length < 2) {
          newPowerUps.push(getRandomPowerUp());
        }

        return {
          ...p,
          spaceIndex: newIndex,
          lap: completedLap ? p.lap + 1 : p.lap,
          stars: newStars,
          powerUps: newPowerUps,
          shieldActive: completedLap ? false : p.shieldActive, // Shield expires after full lap
        };
      });

      return {
        ...prev,
        phase: hitTrap ? 'turn_start' : 'space_action',
        diceRoll: currentRolls,
        players: updatedPlayers,
        traps: updatedTraps,
        activeMessage: msg,
      };
    });
  }, [updateAndBroadcastState]);

  // 4. Use Power-Up
  const usePowerUp = useCallback((playerId: string, powerUp: PowerUpType, targetPlayerId?: string) => {
    updateAndBroadcastState((prev) => {
      const playerIndex = prev.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return prev;
      const player = prev.players[playerIndex];

      // Remove power-up from backpack
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
          newDiceRoll = [1, 1]; // Queue double dice
          msg = `🍄 ¡${player.name} usó Champiñón Turbo! Tirará 2 dados.`;
          break;

        case 'golden_die':
          sounds.playCoin();
          msg = `🎲 ¡${player.name} usó el Dado Dorado de la Suerte! Sacará un 4, 5 o 6.`;
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

  // 5. Submit Retro Card (Green, Yellow, Red)
  const submitRetroCard = useCallback((cardData: Omit<RetroCard, 'id' | 'timestamp'>) => {
    sounds.playStarFanfare();

    const newCard: RetroCard = {
      ...cardData,
      id: `card-${Date.now()}`,
      timestamp: Date.now(),
    };

    updateAndBroadcastState((prev) => {
      const updatedPlayers = prev.players.map((p) => {
        if (p.id !== cardData.playerId) return p;

        // Unlock medal and award +1 Star!
        const updatedMedals = {
          ...p.medals,
          [cardData.category]: true,
        };

        return {
          ...p,
          stars: p.stars + 1,
          medals: updatedMedals,
        };
      });

      return {
        ...prev,
        retroCards: [newCard, ...prev.retroCards],
        players: updatedPlayers,
        activeMessage: `⭐ ¡${cardData.playerName} aportó a la retrospectiva y ganó +1 Estrella!`,
      };
    });
  }, [updateAndBroadcastState]);

  // 6. Next Turn
  const nextTurn = useCallback(() => {
    updateAndBroadcastState((prev) => {
      if (prev.players.length === 0) return prev;
      const nextIdx = (prev.activePlayerIndex + 1) % prev.players.length;
      const nextPlayer = prev.players[nextIdx];

      // Check if turn count triggers end or minigame
      return {
        ...prev,
        activePlayerIndex: nextIdx,
        phase: 'turn_start',
        diceRoll: [1],
        activeMessage: `Turno de ${nextPlayer?.name || 'Siguiente jugador'}. ¡Lanza el dado!`,
      };
    });
  }, [updateAndBroadcastState]);

  // 7. Trigger Minigame Express
  const triggerMinigame = useCallback((type: MinigameType) => {
    sounds.playJump();

    const minigameState: MinigameState = {
      active: true,
      type,
      title: type === 'block_smash' ? '⚡ ¡Machaca el Bloque !' : '🗳️ Votación Rápida del Sprint',
      question: type === 'quick_vote' ? getRandomVoteQuestion().question : undefined,
      endsAt: Date.now() + 8000, // 8 seconds
      countdown: 8,
      scores: {},
      votes: {},
    };

    updateAndBroadcastState((prev) => ({
      ...prev,
      phase: 'minigame',
      minigame: minigameState,
      activeMessage: `¡MINIJUEGO EXPRESS: ${minigameState.title}!`,
    }));
  }, [updateAndBroadcastState]);

  // 8. Submit Minigame Tap (Block Smash)
  const submitMinigameTap = useCallback((playerId: string) => {
    sounds.playSmash();
    updateAndBroadcastState((prev) => {
      if (!prev.minigame || prev.minigame.type !== 'block_smash') return prev;
      const currentScore = prev.minigame.scores[playerId] || 0;
      return {
        ...prev,
        minigame: {
          ...prev.minigame,
          scores: {
            ...prev.minigame.scores,
            [playerId]: currentScore + 1,
          },
        },
      };
    });
  }, [updateAndBroadcastState]);

  // 9. Submit Minigame Vote (Quick Vote)
  const submitMinigameVote = useCallback((voterId: string, targetId: string) => {
    sounds.playCoin();
    updateAndBroadcastState((prev) => {
      if (!prev.minigame || prev.minigame.type !== 'quick_vote') return prev;
      return {
        ...prev,
        minigame: {
          ...prev.minigame,
          votes: {
            ...prev.minigame.votes,
            [voterId]: targetId,
          },
        },
      };
    });
  }, [updateAndBroadcastState]);

  // 10. Finish Minigame & Award +2 Stars
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
        // Count votes
        const voteCounts: Record<string, number> = {};
        Object.values(prev.minigame.votes).forEach((targetId) => {
          voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        });
        let maxVotes = -1;
        Object.entries(voteCounts).forEach(([pId, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            winnerId = pId;
          }
        });
      }

      sounds.playVictory();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

      const updatedPlayers = prev.players.map((p) => {
        if (p.id === winnerId) {
          return { ...p, stars: p.stars + 2 };
        }
        return p;
      });

      const winnerPlayer = prev.players.find((p) => p.id === winnerId);
      const msg = winnerPlayer
        ? `🏆 ¡${winnerPlayer.name} ganó el Minijuego y recibe +2 Estrellas doradas!`
        : '¡Minijuego concluido!';

      return {
        ...prev,
        phase: 'turn_start',
        minigame: null,
        players: updatedPlayers,
        activeMessage: msg,
      };
    });
  }, [updateAndBroadcastState]);

  // 11. Enter Peaje (Fill missing cards before podium)
  const enterPeaje = useCallback(() => {
    sounds.playCoin();
    updateAndBroadcastState((prev) => ({
      ...prev,
      phase: 'peaje',
      activeMessage: '🏁 Fase de El Peaje: Completando tarjetas pendientes antes del podio.',
    }));
  }, [updateAndBroadcastState]);

  // 12. Enter Podium & Award Bonus Stars
  const enterPodium = useCallback(() => {
    sounds.playVictory();
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });

    updateAndBroadcastState((prev) => {
      // Award Bonus Star: Compañerismo to player with most praise cards received
      const praiseCounts: Record<string, number> = {};
      prev.retroCards.forEach((c) => {
        if (c.category === 'seguir' && c.recipientId) {
          praiseCounts[c.recipientId] = (praiseCounts[c.recipientId] || 0) + 1;
        }
      });

      let maxPraise = 0;
      let praiseWinnerId: string | undefined = undefined;
      Object.entries(praiseCounts).forEach(([pId, count]) => {
        if (count > maxPraise) {
          maxPraise = count;
          praiseWinnerId = pId;
        }
      });

      const updatedPlayers = prev.players.map((p) => {
        if (p.id === praiseWinnerId && !prev.bonusStarsAwarded) {
          return { ...p, stars: p.stars + 1 };
        }
        return p;
      });

      return {
        ...prev,
        phase: 'podium',
        players: updatedPlayers,
        bonusStarsAwarded: true,
        activeMessage: '🏆 ¡GRAN CEREMONIA DE PODIO Y RETROSPECTIVA SPRINT PARTY! 🏆',
      };
    });
  }, [updateAndBroadcastState]);

  // 13. Reset Game
  const resetGame = useCallback(() => {
    const newCode = generateRoomCode();
    setGameState({
      roomCode: newCode,
      phase: 'lobby',
      players: [],
      activePlayerIndex: 0,
      diceRoll: [1],
      currentTurn: 1,
      maxTurns: 15,
      boardSpaces: BOARD_SPACES,
      traps: [],
      retroCards: [],
      minigame: null,
      activeMessage: '¡Esperando a que los jugadores se unan con el Joy-Phone!',
      starLeaderId: undefined,
      bonusStarsAwarded: false,
    });
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        myPlayerId,
        setMyPlayerId,
        isHost,
        setIsHost,
        createRoom,
        joinPlayer,
        rollDice,
        usePowerUp,
        submitRetroCard,
        triggerMinigame,
        submitMinigameTap,
        submitMinigameVote,
        finishMinigame,
        enterPeaje,
        enterPodium,
        nextTurn,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
