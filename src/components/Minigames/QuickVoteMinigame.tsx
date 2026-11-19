import React, { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';

interface QuickVoteProps {
  isController?: boolean;
}

export const QuickVoteMinigame: React.FC<QuickVoteProps> = ({ isController = false }) => {
  const { gameState, submitMinigameVote, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!minigame) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Finish when time runs out or all connected players voted
      const totalVotes = Object.keys(minigame.votes || {}).length;
      if (remaining <= 0 || (players.length > 0 && totalVotes >= players.length)) {
        clearInterval(interval);
        setTimeout(() => {
          finishMinigame();
        }, 1500);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [minigame, players.length, finishMinigame]);

  const handleVote = (targetId: string) => {
    if (selectedTarget) return; // already voted
    setSelectedTarget(targetId);
    submitMinigameVote(myPlayerId, targetId);
  };

  if (!minigame) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-6 max-w-xl">
        <div className="text-xs font-pixel uppercase tracking-widest text-indigo-400 mb-1">
          MINIJUEGO EXPRESS • ¡PREMIO: +2 ESTRELLAS!
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
          🗳️ VOTACIÓN RÁPIDA DEL SPRINT
        </h2>
        <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-lg md:text-xl font-bold text-white shadow-lg">
          {minigame.question || '¿Quién fue el MVP indiscutible de este sprint?'}
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Votos emitidos: {Object.keys(minigame.votes || {}).length} / {players.length} • Tiempo: {timeLeft}s
        </div>
      </div>

      {/* Controller Vote Buttons */}
      {isController ? (
        <div className="w-full max-w-md grid grid-cols-2 gap-3">
          {players.map((player) => {
            const char = CHARACTERS[player.characterId];
            const isSelected = selectedTarget === player.id;

            return (
              <button
                key={player.id}
                onClick={() => handleVote(player.id)}
                disabled={!!selectedTarget}
                className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all duration-150 ${
                  isSelected
                    ? 'bg-cyan-500/30 border-cyan-400 scale-102 shadow-lg ring-2 ring-cyan-400'
                    : 'bg-slate-900 border-white/10 hover:bg-slate-850 hover:border-white/30'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 font-bold border-2"
                  style={{ backgroundColor: `${char.color}22`, borderColor: char.neonColor }}
                >
                  {char.avatar}
                </div>
                <div className="text-left font-bold text-sm text-white truncate">{player.name}</div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Host TV Summary */
        <div className="w-full max-w-lg bg-slate-900/80 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-slate-300 text-sm mb-4">
            ¡Vota en tu Joy-Phone! Los votos son secretos hasta que termine el recuento.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {players.map((player) => {
              const char = CHARACTERS[player.characterId];
              const hasVoted = !!minigame.votes[player.id];

              return (
                <div
                  key={player.id}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    hasVoted
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-800/40 border-white/10 text-slate-400 opacity-60'
                  }`}
                >
                  <span>{char.avatar}</span>
                  <span>{player.name}</span>
                  <span>{hasVoted ? '✓ Listo' : '...'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
