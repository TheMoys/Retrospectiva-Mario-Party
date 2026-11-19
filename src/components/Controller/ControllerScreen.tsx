import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { POWER_UPS } from '@/constants/powerUps';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { BlockSmashMinigame } from '@/components/Minigames/BlockSmashMinigame';
import { QuickVoteMinigame } from '@/components/Minigames/QuickVoteMinigame';
import { TargetRouletteModal } from '@/components/Common/TargetRouletteModal';
import { ChaosEventModal } from '@/components/Common/ChaosEventModal';
import { sounds } from '@/audio/soundEffects';

export const ControllerScreen: React.FC = () => {
  const { gameState, myPlayerId, rollDice, usePowerUp } = useGame();

  const me = gameState.players.find((p) => p.id === myPlayerId);
  const activePlayer = gameState.players[gameState.activePlayerIndex];
  const isMyTurn = activePlayer?.id === myPlayerId;
  const isRolling = gameState.phase === 'rolling' || gameState.phase === 'moving';

  if (!me) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <span className="text-4xl animate-bounce mb-3">🎮</span>
        <h2 className="text-lg font-bold">Conectando Joy-Phone...</h2>
        <p className="text-xs text-slate-400 mt-1">Sala: {gameState.roomCode}</p>
      </div>
    );
  }

  const char = CHARACTERS[me.characterId];
  const receivedCardsCount = gameState.retroCards.filter((c) => c.recipientId === me.id).length;

  const handleRoll = () => {
    if (!isMyTurn || isRolling) return;
    if (navigator.vibrate) navigator.vibrate(60);
    rollDice(me.id);
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col select-none overflow-y-auto overflow-x-hidden font-game">
      {/* 1. Header (Matching Reference Screen) */}
      <div
        className="p-3 border-b border-white/10 flex items-center justify-between shrink-0"
        style={{ backgroundColor: `${char.color}22` }}
      >
        <div className="flex items-center gap-2.5">
          <CharacterAvatar characterId={me.characterId} size="md" />
          <div>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{me.name}</span>
              {me.role && (
                <span className="text-[10px] text-slate-400 font-bold">({me.role})</span>
              )}
              {gameState.starLeaderId === me.id && <span>👑</span>}
            </div>
            <div className="text-[10px] text-yellow-300 font-bold flex items-center gap-1">
              <span>★ {me.stars} estrellas</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">{receivedCardsCount} recibidos</span>
            </div>
          </div>
        </div>

        {/* 3 Medals Unlocked: 🟢 🟡 🔴 */}
        <div className="flex items-center gap-1 text-sm bg-slate-950/80 px-2 py-1 rounded-xl border border-white/10">
          <span className={me.medals.seguir ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}>🟢</span>
          <span className={me.medals.mejorar ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}>🟡</span>
          <span className={me.medals.dejar ? 'opacity-100 scale-110' : 'opacity-20 grayscale'}>🔴</span>
        </div>
      </div>

      {/* 2. Middle Body: Turn Status + Giant Roll Button */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Turn Status Banner */}
        <div className="mb-3 text-center">
          {isMyTurn ? (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg animate-pulse">
              <span>⚡</span>
              <span>¡TU TURNO EN LA SENDA!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <span>⏳</span>
              <span>Turno de {activePlayer?.name || 'Compañero'}</span>
            </div>
          )}
        </div>

        {/* Big Tactile Roll Button (Matching Reference) */}
        <button
          onClick={handleRoll}
          disabled={!isMyTurn || isRolling}
          className={`relative w-40 h-40 md:w-44 md:h-44 rounded-3xl transition-all duration-150 flex flex-col items-center justify-center select-none active:scale-95 cursor-pointer ${
            isMyTurn && !isRolling
              ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 border-4 border-amber-900 text-amber-950 shadow-2xl hover:scale-102 ring-4 ring-yellow-400/50'
              : 'bg-slate-800 border-4 border-slate-700 opacity-50 cursor-not-allowed shadow-none text-slate-400'
          }`}
          style={
            isMyTurn && !isRolling
              ? {
                  boxShadow: '0 14px 30px rgba(245, 158, 11, 0.45), inset 0 -8px 0 #78350F',
                }
              : {}
          }
        >
          <span className="text-5xl md:text-6xl mb-1 filter drop-shadow">
            🎲
          </span>
          <span className="text-xs md:text-sm font-black uppercase tracking-wider">
            {isRolling ? 'TIRANDO...' : 'TIRAR DADO'}
          </span>
        </button>
      </div>

      {/* 3. Bottom Section: Mochila de Power-Ups (Matching Reference) */}
      <div className="p-3 border-t border-white/10 bg-slate-950/90 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1 text-slate-200">
            <span>🎒</span>
            <span>MOCHILA POWER-UPS ({me.powerUps.length}/2)</span>
          </span>
          <span className="text-yellow-400">PASA POR SALIDA = +1 ⭐</span>
        </div>

        {me.powerUps.length === 0 ? (
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-white/10 text-center text-[10px] text-slate-500 italic">
            Mochila vacía. Cae en una Casilla Caos para conseguir un objeto.
          </div>
        ) : (
          <div className="space-y-1.5">
            {me.powerUps.map((pupType, idx) => {
              const pupInfo = POWER_UPS[pupType];
              return (
                <div
                  key={`${pupType}-${idx}`}
                  className="p-2 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl">{pupInfo.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">{pupInfo.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{pupInfo.description}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // If Boo, pick rival with most stars
                      const others = gameState.players.filter((p) => p.id !== me.id).sort((a, b) => b.stars - a.stars);
                      usePowerUp(me.id, pupType, others[0]?.id);
                    }}
                    className="px-3 py-1 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] uppercase shrink-0 shadow-md active:scale-95 transition-all"
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