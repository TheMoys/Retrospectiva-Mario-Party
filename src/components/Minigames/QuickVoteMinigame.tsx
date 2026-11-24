import React, { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface QuickVoteProps {
  isController?: boolean;
}

export const QuickVoteMinigame: React.FC<QuickVoteProps> = ({ isController = false }) => {
  const { gameState, isHost, submitMinigameVote, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(12);

  useEffect(() => {
    if (
      !minigame ||
      minigame.phase === 'roulette' ||
      minigame.phase === 'instructions' ||
      minigame.phase === 'results'
    ) {
      return;
    }

    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const remaining = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      return remaining;
    };

    syncRemaining();

    const totalVotes = Object.keys(minigame.votes || {}).length;
    if (players.length > 0 && totalVotes >= players.length && !isController && isHost) {
      finishTimer = setTimeout(() => {
        finishMinigame();
      }, 1200);
      return () => {
        if (finishTimer) clearTimeout(finishTimer);
      };
    }

    const interval = setInterval(() => {
      const remaining = syncRemaining();
      const votesCount = Object.keys(minigame.votes || {}).length;
      if (remaining <= 0 || (players.length > 0 && votesCount >= players.length)) {
        clearInterval(interval);
        if (!isController && isHost && !finishTimer) {
          finishTimer = setTimeout(() => {
            finishMinigame();
          }, 1200);
        }
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [minigame?.phase, minigame?.endsAt, minigame?.votes, players.length, isController, isHost, finishMinigame]);

  const handleVote = (targetId: string) => {
    if (selectedTarget || minigame?.phase !== 'playing') return;
    setSelectedTarget(targetId);
    submitMinigameVote(myPlayerId, targetId);
  };

  if (!minigame || minigame.phase === 'roulette') return null;

  if (minigame.phase === 'results') {
    return <MinigameResultsOverlay isController={isController} />;
  }

  if (minigame.phase === 'instructions') {
    if (isController) {
      return (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Votación en Preparación"
          className="fixed inset-0 z-50 bg-slate-950/95 overflow-y-auto flex flex-col items-center p-6 pb-20 text-center select-none font-game animate-fade-in motion-reduce:animate-none"
        >
          <div className="my-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">🗳️</span>
            </div>
            <span className="text-xs font-game font-black text-cyan-300 uppercase tracking-widest mb-1">
              Votación en Preparación
            </span>
            <h3 className="text-xl font-black text-white">¡Atento a la Pantalla Grande!</h3>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Lee la pregunta proyectada en la sala. En breve podrás votar a tu compañero favorito.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const allVoted = players.length > 0 && Object.keys(minigame.votes || {}).length >= players.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Votación rápida del sprint"
      className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col items-center p-4 ${
        isController ? 'pb-20' : ''
      }`}
    >
      <div className="my-auto flex flex-col items-center w-full">
        {/* Header */}
        <div className="text-center mb-5 max-w-xl">
          <div className="text-xs font-game font-black uppercase tracking-widest text-indigo-300 mb-1">
            MINIJUEGO EXPRESS • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
            🗳️ VOTACIÓN RÁPIDA DEL SPRINT
          </h2>
          <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-lg md:text-xl font-bold text-white shadow-lg">
            {minigame.question || '¿Quién fue el MVP indiscutible de este sprint?'}
          </div>
          <div role="status" aria-live="polite" className="mt-2 text-xs text-slate-200 font-semibold">
            {timeLeft <= 0 || allVoted
              ? '⏳ ¡Votos cerrados! Revelando ganador...'
              : `Votos emitidos: ${Object.keys(minigame.votes || {}).length} / ${players.length} • Tiempo: ${timeLeft}s`}
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
                  type="button"
                  key={player.id}
                  aria-pressed={isSelected}
                  onClick={() => handleVote(player.id)}
                  disabled={!!selectedTarget}
                  className={`min-h-[52px] p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    isSelected
                      ? 'bg-cyan-500/30 border-cyan-400 scale-[1.02] shadow-lg ring-2 ring-cyan-400'
                      : 'bg-slate-900 border-white/15 hover:bg-slate-800 hover:border-white/30'
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
          <div className="w-full max-w-lg bg-slate-900/90 border border-white/15 rounded-2xl p-6 text-center">
            <p className="text-slate-200 text-sm mb-4">
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
                        ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-200'
                        : 'bg-slate-900/95 border-white/20 text-slate-200'
                    }`}
                  >
                    <span aria-hidden="true">{char.avatar}</span>
                    <span>{player.name}</span>
                    <span>{hasVoted ? '✓ Listo' : 'Pendiente'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
