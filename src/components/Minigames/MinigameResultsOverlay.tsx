import React, { useEffect, useId, useRef } from 'react';
import { Trophy, Sparkles, Star, ArrowRight, Clock } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';

interface MinigameResultsOverlayProps {
  isController?: boolean;
}

export const MinigameResultsOverlay: React.FC<MinigameResultsOverlayProps> = ({
  isController = false,
}) => {
  const { gameState, myPlayerId, isHost, closeMinigameResults } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (minigame?.phase === 'results') {
      dialogRef.current?.focus();
    }
  }, [minigame?.phase]);

  if (!minigame || minigame.phase !== 'results') return null;

  const isBlockSmash = minigame.type === 'block_smash';
  const metricLabel = isBlockSmash ? 'golpes' : 'votos';

  const getPlayerMetric = (playerId: string): number => {
    if (isBlockSmash) {
      return minigame.scores?.[playerId] || 0;
    }
    return Object.values(minigame.votes || {}).filter((v) => v === playerId).length;
  };

  const winnerIds =
    minigame.winnerPlayerIds && minigame.winnerPlayerIds.length > 0
      ? minigame.winnerPlayerIds
      : minigame.winnerPlayerId
      ? [minigame.winnerPlayerId]
      : [];

  const winnerSet = new Set(winnerIds);
  const winners = players.filter((p) => winnerSet.has(p.id));
  const isTie = winners.length > 1;
  const noScore = winners.length === 0;
  const iWon = Boolean(myPlayerId && winnerSet.has(myPlayerId));

  const rankedPlayers = [...players]
    .map((p) => ({
      player: p,
      score: getPlayerMetric(p.id),
      isWinner: winnerSet.has(p.id),
    }))
    .sort((a, b) => b.score - a.score || b.player.stars - a.player.stars);

  if (isController) {
    return (
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl overflow-y-auto flex flex-col items-center p-4 pb-20 text-center select-none font-game animate-fade-in motion-reduce:animate-none focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="my-auto w-full max-w-sm rounded-3xl border-2 border-amber-400/70 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-5 shadow-2xl animate-modal-spring motion-reduce:animate-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-extrabold uppercase tracking-wider mb-3">
            <Trophy className="w-3.5 h-3.5 text-yellow-300" aria-hidden="true" />
            <span>Resultado del Minijuego</span>
          </div>

          {noScore ? (
            <>
              <div className="text-4xl mb-2" aria-hidden="true">🤝</div>
              <h3 id={titleId} className="text-2xl font-black text-white">
                Sin puntuación
              </h3>
              <p className="text-xs text-slate-300 mt-1">Nadie sumó puntos en esta ronda.</p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {winners.map((w) => (
                  <CharacterAvatar key={w.id} characterId={w.characterId} size="lg" />
                ))}
              </div>

              <h3
                id={titleId}
                className={`text-2xl font-black tracking-wide ${
                  iWon ? 'text-yellow-300' : 'text-white'
                }`}
              >
                {iWon
                  ? '¡GANASTE! 🎉'
                  : isTie
                  ? `¡Empate: ${winners.map((w) => w.name).join(' y ')}!`
                  : `¡Ganó ${winners[0]?.name}!`}
              </h3>

              <div className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black uppercase shadow-lg">
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>+2 Estrellas</span>
              </div>
            </>
          )}

          {/* Compact Top-3 Podium */}
          <div className="mt-4 space-y-2 text-left">
            {rankedPlayers.slice(0, 3).map((entry, idx) => (
              <div
                key={entry.player.id}
                className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${
                  entry.isWinner
                    ? 'bg-amber-500/20 border-amber-400/60 text-white'
                    : 'bg-slate-900/90 border-white/15 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-yellow-300 w-5 shrink-0">
                    #{idx + 1}
                  </span>
                  <CharacterAvatar characterId={entry.player.characterId} size="sm" showBorder={false} />
                  <span className="text-xs font-bold truncate">{entry.player.name}</span>
                </div>
                <span className="text-xs font-extrabold text-amber-200 shrink-0">
                  {entry.score} {metricLabel}
                </span>
              </div>
            ))}
          </div>

          <div
            role="status"
            aria-live="polite"
            className="mt-4 inline-flex items-center gap-2 text-xs text-slate-300 font-semibold"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
            <span>Esperando al anfitrión para continuar...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center p-4 md:p-6 select-none font-game animate-fade-in motion-reduce:animate-none overflow-y-auto focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="my-auto w-full max-w-2xl rounded-3xl border-2 border-yellow-400/70 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-900/95 p-6 md:p-8 shadow-2xl flex flex-col items-center text-center animate-modal-spring motion-reduce:animate-none">
        {/* Top Trophy Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-200 text-xs font-black uppercase tracking-widest mb-4 shadow">
          <Trophy className="w-4 h-4 text-yellow-300" aria-hidden="true" />
          <span>{isTie ? '¡Empate en la Cima!' : '¡Ganador del Minijuego!'}</span>
        </div>

        {noScore ? (
          <div className="my-4">
            <div className="text-5xl mb-3" aria-hidden="true">🤝</div>
            <h2 id={titleId} className="text-3xl md:text-4xl font-black text-white">
              Ronda sin puntuación
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Ningún jugador registró {metricLabel} en esta ocasión.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center my-2">
            {/* Prominent Winner Avatars */}
            <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
              {winners.map((winner) => {
                const charInfo = CHARACTERS[winner.characterId] || CHARACTERS.mario;
                return (
                  <div key={winner.id} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <div
                        className="absolute -inset-2 rounded-3xl opacity-45 blur-md"
                        style={{ backgroundColor: charInfo.neonColor }}
                        aria-hidden="true"
                      />
                      <CharacterAvatar
                        characterId={winner.characterId}
                        size={isTie ? 'lg' : 'xl'}
                        className="relative"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {charInfo.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <h2
              id={titleId}
              className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-md"
            >
              {winners.map((w) => w.name).join(' & ')}
            </h2>

            <div className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>+2</span>
              <Star className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
              <span>Estrellas de Premio</span>
            </div>
          </div>
        )}

        {/* Full Ranked Leaderboard */}
        <div className="w-full mt-6 bg-slate-950/90 border border-white/15 rounded-2xl p-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-3">
            Tabla Final • {minigame.title}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {rankedPlayers.map((entry, idx) => (
              <div
                key={entry.player.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                  entry.isWinner
                    ? 'bg-amber-500/20 border-yellow-400/70 ring-1 ring-yellow-400/50 shadow-md'
                    : 'bg-slate-900/90 border-white/15'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                      entry.isWinner
                        ? 'bg-yellow-400 text-slate-950'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <CharacterAvatar characterId={entry.player.characterId} size="sm" showBorder={false} />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">
                      {entry.player.name}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">
                      ★ {entry.player.stars} en total
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-yellow-300">{entry.score}</div>
                  <div className="text-xs text-slate-300">{metricLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Host Explicit Continue Action */}
        {isHost && (
          <button
            type="button"
            onClick={closeMinigameResults}
            className="mt-6 min-h-[44px] px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl hover:brightness-105 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Continuar al Tablero</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
