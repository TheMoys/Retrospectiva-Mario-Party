import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { sounds } from '@/audio/soundEffects';

export const BonusStarsModal: React.FC = () => {
  const { gameState, spinBonusStar, enterPodium } = useGame();
  const { players, phase, bonusStarWheel } = gameState;

  // Players eligible for bonus star (those with all 3 medals completed)
  const eligiblePlayers = players.filter((p) => p.medals.seguir && p.medals.mejorar && p.medals.dejar);
  const [currentIdx, setCurrentIdx] = useState(0);

  if (phase !== 'bonus_stars' || eligiblePlayers.length === 0) return null;

  const currentPlayer = eligiblePlayers[currentIdx] || eligiblePlayers[0];

  const handleSpin = () => {
    spinBonusStar(currentPlayer.id);
  };

  const handleNextPlayer = () => {
    if (currentIdx + 1 < eligiblePlayers.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      enterPodium();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl rounded-3xl border-2 border-yellow-400/80 p-6 md:p-8 shadow-2xl bg-gradient-to-b from-yellow-950 via-slate-900 to-slate-950 text-center flex flex-col items-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-950/80 border border-yellow-400/40 text-xs font-bold text-yellow-300 mb-2">
          <span>🌟</span>
          <span>EL GIRO FINAL • BONUS STARS</span>
        </div>

        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400">
          Ruleta de Bonificación
        </h3>
        <p className="text-xs text-slate-300 mt-1 mb-6">
          Premio para los integrantes que completaron sus 3 medallas en este sprint.
        </p>

        {/* Current Eligible Player Card */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/15 flex items-center gap-4 w-full max-w-md mb-6 justify-center">
          <CharacterAvatar characterId={currentPlayer.characterId} size="lg" />
          <div className="text-left">
            <div className="text-base font-black text-white">{currentPlayer.name}</div>
            <div className="text-xs text-yellow-300 font-bold">⭐ {currentPlayer.stars} Estrellas</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">🟢 🟡 🔴 Álbum Completo</div>
          </div>
        </div>

        {/* Spin Result or Trigger */}
        {bonusStarWheel && bonusStarWheel.playerId === currentPlayer.id ? (
          <div className="w-full p-5 rounded-2xl bg-yellow-500/10 border-2 border-yellow-400/50 mb-6 animate-bounce">
            <div className="text-5xl mb-2">
              {bonusStarWheel.starType === 'critico' && '⭐'}
              {bonusStarWheel.starType === 'robo' && '🦹'}
              {bonusStarWheel.starType === 'reconocimiento' && '🤝'}
            </div>
            <div className="text-lg font-black text-yellow-300 uppercase tracking-wide">
              {bonusStarWheel.starType === 'critico' && '¡Estrella del Crítico! (+2 Estrellas)'}
              {bonusStarWheel.starType === 'robo' && '¡Estrella del Robo! (-1 / +1 Estrella)'}
              {bonusStarWheel.starType === 'reconocimiento' && '¡Estrella del Reconocimiento! (+2 Estrellas para otro)'}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {gameState.activeMessage}
            </p>
          </div>
        ) : (
          <button
            onClick={handleSpin}
            className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-xl mb-6 flex items-center justify-center gap-2"
          >
            <span>🎰</span>
            <span>¡Girar Ruleta Bonus para {currentPlayer.name}!</span>
          </button>
        )}

        {/* Next / Proceed Button */}
        {bonusStarWheel && bonusStarWheel.playerId === currentPlayer.id && (
          <button
            onClick={handleNextPlayer}
            className="w-full max-w-md py-3.5 rounded-2xl bg-slate-800 border border-white/20 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <span>{currentIdx + 1 < eligiblePlayers.length ? 'Siguiente Jugador ➔' : '🏆 ¡Ir al Podio de Campeones!'}</span>
          </button>
        )}
      </div>
    </div>
  );
};