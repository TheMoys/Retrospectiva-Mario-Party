import React, { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { sounds } from '@/audio/soundEffects';

interface BlockSmashProps {
  isController?: boolean;
}

export const BlockSmashMinigame: React.FC<BlockSmashProps> = ({ isController = false }) => {
  const { gameState, submitMinigameTap, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const [timeLeft, setTimeLeft] = useState(8);
  const [localTaps, setLocalTaps] = useState(0);

  useEffect(() => {
    if (!minigame || minigame.phase === 'instructions') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          finishMinigame();
        }, 1200);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [minigame, finishMinigame]);

  const handleTap = () => {
    if (timeLeft <= 0 || minigame?.phase === 'instructions') return;
    setLocalTaps((prev) => prev + 1);
    submitMinigameTap(myPlayerId);
  };

  if (!minigame) return null;

  if (minigame.phase === 'instructions') {
    if (isController) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center select-none font-game animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle">
            ⚡
          </div>
          <span className="text-xs font-pixel text-yellow-300 uppercase tracking-widest mb-1">
            Minijuego en Preparación
          </span>
          <h3 className="text-xl font-black text-white">¡Atento a la Pantalla Grande!</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
            El anfitrión está mostrando las instrucciones. ¡Prepárate para pulsar tu Joy-Phone!
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      {/* Minigame Header Banner */}
      <div className="text-center mb-6">
        <div className="text-xs font-pixel uppercase tracking-widest text-amber-400 mb-1">
          MINIJUEGO EXPRESS • ¡PREMIO: +2 ESTRELLAS!
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-md">
          ⚡ ¡MACHACA EL BLOQUE ?!
        </h2>
        <p className="text-slate-300 text-sm mt-1 max-w-md mx-auto">
          Pulsa el Bloque ? tantas veces como puedas antes de que se acabe el tiempo.
        </p>

        {/* Big Countdown Timer */}
        <div className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-full bg-red-600/30 border-2 border-red-500 text-red-400 font-pixel text-xl animate-pulse">
          ⏱️ {timeLeft}s
        </div>
      </div>

      {/* Main Interactive Smash Area for Joy-Phone */}
      {isController ? (
        <div className="flex flex-col items-center justify-center w-full max-w-sm">
          <button
            onClick={handleTap}
            disabled={timeLeft <= 0}
            className="w-48 h-48 md:w-56 md:h-56 rounded-3xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-amber-800 shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform duration-75 group select-none cursor-pointer"
            style={{
              boxShadow: '0 15px 35px rgba(245, 158, 11, 0.5), inset 0 -8px 0 #78350F',
            }}
          >
            <span className="text-7xl font-extrabold text-white text-stroke-md drop-shadow group-active:scale-110 transition-transform">
              ?
            </span>
            <span className="text-xs font-bold text-amber-950 uppercase mt-1">¡PULSA RÁPIDO!</span>
          </button>

          <div className="mt-4 text-xl font-extrabold text-yellow-300 font-pixel">
            TUS GOLPES: {localTaps}
          </div>
        </div>
      ) : (
        /* Host TV Live Scoreboard */
        <div className="w-full max-w-2xl bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
            Progreso en Vivo de los Jugadores
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {players.map((player) => {
              const char = CHARACTERS[player.characterId];
              const score = minigame.scores[player.id] || 0;

              return (
                <div
                  key={player.id}
                  className="bg-slate-800/80 rounded-xl p-3 border border-white/10 flex items-center gap-3 relative overflow-hidden"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 font-bold border-2"
                    style={{ backgroundColor: `${char.color}22`, borderColor: char.neonColor }}
                  >
                    {char.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{player.name}</div>
                    <div className="text-lg font-extrabold text-yellow-400 font-pixel">{score}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
