import React, { useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { POWER_UPS } from '@/constants/powerUps';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { BlockSmashMinigame } from '@/components/Minigames/BlockSmashMinigame';
import { QuickVoteMinigame } from '@/components/Minigames/QuickVoteMinigame';
import { TargetRouletteModal } from '@/components/Common/TargetRouletteModal';
import { ChaosEventModal } from '@/components/Common/ChaosEventModal';
import { JoyPhoneSetup } from '@/components/Controller/JoyPhoneSetup';

export const ControllerScreen: React.FC = () => {
  const { gameState, myPlayerId, setMyPlayerId, rollDice, usePowerUp } = useGame();

  // Attempt to restore existing player session from sessionStorage
  useEffect(() => {
    if (!myPlayerId && typeof window !== 'undefined' && window.sessionStorage) {
      const savedId = window.sessionStorage.getItem('sprint_party_player_id');
      if (savedId) {
        setMyPlayerId(savedId);
      }
    }
  }, [myPlayerId, setMyPlayerId]);

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const isGameStarted = gameState.phase !== 'lobby';
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = isGameStarted && activePlayer?.id === myPlayerId;
  const isRolling = gameState.phase === 'rolling' || gameState.phase === 'moving';

  // If player has not configured their Joy-Phone profile yet, display Onboarding Form
  if (!me) {
    return <JoyPhoneSetup initialRoomCode={gameState.roomCode} />;
  }

  const char = CHARACTERS[me.characterId] || CHARACTERS.mario;
  const receivedCardsCount = gameState.retroCards.filter((c) => c.recipientId === me.id).length;

  const handleRoll = () => {
    if (!isGameStarted || !isMyTurn || isRolling) return;
    if (navigator.vibrate) navigator.vibrate(60);
    rollDice(me.id);
  };

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] bg-slate-950 text-white flex flex-col justify-between overflow-hidden p-2.5 sm:p-3 select-none font-game">
      {/* 1. COMPACT TOP HUD: Player Info & Medals */}
      <div
        className="px-3 py-2 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg shrink-0"
        style={{
          background: `linear-gradient(135deg, ${char.color}25 0%, rgba(15, 23, 42, 0.95) 100%)`,
          boxShadow: `0 4px 20px ${char.neonColor}18`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CharacterAvatar characterId={me.characterId} size="md" />
          <div className="min-w-0">
            <div className="text-sm font-black text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{me.name}</span>
              {me.role && (
                <span className="text-[10px] text-slate-400 font-bold shrink-0">({me.role})</span>
              )}
              {gameState.starLeaderId === me.id && <span className="shrink-0">👑</span>}
            </div>
            <div className="text-[10px] text-yellow-300 font-bold flex items-center gap-1 mt-0.5">
              <span>★ {me.stars}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{receivedCardsCount} recibidos</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 font-mono font-bold">Sala {gameState.roomCode}</span>
            </div>
          </div>
        </div>

        {/* 3 Retro Medals: 🟢 Seguir, 🟡 Mejorar, 🔴 Dejar */}
        <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-white/10 shrink-0">
          <span className={`text-sm ${me.medals.seguir ? 'opacity-100 scale-110 drop-shadow' : 'opacity-20 grayscale'}`} title="Medalla Seguir">🟢</span>
          <span className={`text-sm ${me.medals.mejorar ? 'opacity-100 scale-110 drop-shadow' : 'opacity-20 grayscale'}`} title="Medalla Mejorar">🟡</span>
          <span className={`text-sm ${me.medals.dejar ? 'opacity-100 scale-110 drop-shadow' : 'opacity-20 grayscale'}`} title="Medalla Dejar">🔴</span>
        </div>
      </div>

      {/* 2. CENTER STAGE: Game State Banner + Tactile Dice Action Button */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-0">
        {/* Dynamic Context Status Banner */}
        <div className="mb-3 text-center w-full max-w-xs">
          {!isGameStarted ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-yellow-400/30 text-yellow-300 font-bold text-xs uppercase tracking-wider shadow-md animate-pulse">
              <span>⏳</span>
              <span>SALA DE ESPERA • ESPERANDO AL HOST</span>
            </div>
          ) : isMyTurn ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl animate-bounce">
              <span>⚡</span>
              <span>¡TU TURNO! (CASILLA {me.spaceIndex}/20)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <span>⏳</span>
              <span>Turno de {activePlayer?.name || 'Compañero'} (R{gameState.round}/{gameState.totalRounds})</span>
            </div>
          )}
        </div>

        {/* Tactile Big Die Button (Responsive, Compact, Never Overflows) */}
        <button
          onClick={handleRoll}
          disabled={!isGameStarted || !isMyTurn || isRolling}
          className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl transition-all duration-150 flex flex-col items-center justify-center select-none active:scale-95 cursor-pointer shadow-2xl ${
            isMyTurn && !isRolling
              ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 border-4 border-amber-900 text-amber-950 hover:scale-103 ring-4 ring-yellow-400/50'
              : !isGameStarted
              ? 'bg-slate-900/90 border-2 border-dashed border-white/20 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-slate-800/80 border-4 border-slate-700 opacity-50 cursor-not-allowed text-slate-400'
          }`}
          style={
            isMyTurn && !isRolling
              ? {
                  boxShadow: '0 12px 30px rgba(245, 158, 11, 0.45), inset 0 -6px 0 #78350F',
                }
              : {}
          }
        >
          <span className="text-5xl sm:text-6xl mb-1 filter drop-shadow">
            {!isGameStarted ? '⏳' : '🎲'}
          </span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-center px-2 leading-tight">
            {!isGameStarted
              ? 'ESPERANDO INICIO...'
              : isRolling
              ? 'TIRANDO...'
              : isMyTurn
              ? '¡TIRAR DADO!'
              : `TURNO DE ${activePlayer?.name?.toUpperCase() || 'RIVAL'}`}
          </span>
        </button>

        {!isGameStarted && (
          <p className="text-[11px] text-slate-400 font-semibold text-center mt-3 max-w-xs">
            ¡Estás conectado como <span className="text-white font-bold">{me.name}</span>! El anfitrión iniciará la carrera pronto.
          </p>
        )}
      </div>

      {/* 3. BOTTOM SECTION: Mochila de Power-Ups (Compact & Always in Viewport!) */}
      <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl shrink-0 backdrop-blur-md">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-200">
            <span>🎒</span>
            <span className="text-white font-black">MOCHILA POWER-UPS ({me.powerUps.length}/2)</span>
          </span>
          <span className="text-yellow-400 font-bold">Pasa por Meta = +1 ⭐</span>
        </div>

        {me.powerUps.length === 0 ? (
          <div className="py-2 px-3 rounded-xl bg-slate-950/70 border border-white/5 text-center text-[10px] text-slate-400 flex items-center justify-center gap-2">
            <span>✨</span>
            <span>Mochila vacía. Cae en casillas 🟣 Caos para ganar objetos.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {me.powerUps.map((pupType, idx) => {
              const pupInfo = POWER_UPS[pupType];
              return (
                <div
                  key={`${pupType}-${idx}`}
                  className="p-1.5 px-2.5 rounded-xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">{pupInfo.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-white truncate">{pupInfo.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{pupInfo.description}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const others = gameState.players.filter((p) => p.id !== me.id).sort((a, b) => b.stars - a.stars);
                      usePowerUp(me.id, pupType, others[0]?.id);
                    }}
                    disabled={!isGameStarted || !isMyTurn}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shrink-0 transition-all ${
                      isGameStarted && isMyTurn
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-md active:scale-95 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    USAR
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Minigames Overlay on Joy-Phone */}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'block_smash' && (
        <BlockSmashMinigame isController={true} />
      )}
      {gameState.phase === 'minigame' && gameState.minigame?.type === 'quick_vote' && (
        <QuickVoteMinigame isController={true} />
      )}

      {/* Target Roulette Modal */}
      <TargetRouletteModal />

      {/* Chaos Event Modal */}
      <ChaosEventModal />
    </div>
  );
};
