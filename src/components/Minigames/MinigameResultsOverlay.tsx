import React, { useEffect, useId, useRef } from 'react';
import { Trophy, Sparkles, Star, ArrowRight, Clock, Info } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { Player } from '@/types/game';

interface MinigameResultsOverlayProps {
  isController?: boolean;
}

interface RankedEntry {
  player: Player;
  primaryScore: string;
  secondaryDetail?: string;
  isWinner: boolean;
  sortRank: number;
  sortSecondary: number;
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

  const winnerIds =
    minigame.winnerPlayerIds && minigame.winnerPlayerIds.length > 0
      ? minigame.winnerPlayerIds
      : minigame.winnerPlayerId
      ? [minigame.winnerPlayerId]
      : [];

  const winnerSet = new Set(winnerIds);
  const winners = players.filter((p) => winnerSet.has(p.id));
  const isTie = winners.length > 1;
  const noWinner = winners.length === 0;
  const iWon = Boolean(myPlayerId && winnerSet.has(myPlayerId));

  // Frequency table for Planning Poker collision labels
  const pokerCounts: Record<number, number> = {};
  if (minigame.type === 'planning_poker') {
    Object.values(minigame.pokerBids || {}).forEach((card) => {
      pokerCounts[card] = (pokerCounts[card] || 0) + 1;
    });
  }

  const buildRankedEntry = (player: Player): RankedEntry => {
    const isWinner = winnerSet.has(player.id);

    if (minigame.type === 'block_smash') {
      const clicks = minigame.scores?.[player.id] || 0;
      return {
        player,
        primaryScore: `${clicks}`,
        secondaryDetail: 'golpes',
        isWinner,
        sortRank: clicks,
        sortSecondary: player.stars,
      };
    }

    if (minigame.type === 'quick_vote') {
      const votes = Object.values(minigame.votes || {}).filter((v) => v === player.id).length;
      return {
        player,
        primaryScore: `${votes}`,
        secondaryDetail: 'votos',
        isWinner,
        sortRank: votes,
        sortSecondary: player.stars,
      };
    }

    if (minigame.type === 'blind_timer') {
      const entry = minigame.blindEntries?.[player.id];
      if (!entry) {
        return {
          player,
          primaryScore: '--.-- s',
          secondaryDetail: 'Sin deploy',
          isWinner: false,
          sortRank: -1000000,
          sortSecondary: player.stars,
        };
      }
      return {
        player,
        primaryScore: `${(entry.elapsedMs / 1000).toFixed(2)} s`,
        secondaryDetail: `±${(entry.errorMs / 1000).toFixed(2)} s`,
        isWinner,
        sortRank: -entry.errorMs,
        sortSecondary: player.stars,
      };
    }

    if (minigame.type === 'planning_poker') {
      const bid = minigame.pokerBids?.[player.id];
      if (bid === undefined) {
        return {
          player,
          primaryScore: '--',
          secondaryDetail: 'Sin carta',
          isWinner: false,
          sortRank: -10,
          sortSecondary: player.stars,
        };
      }
      const isCollided = (pokerCounts[bid] || 0) > 1;
      return {
        player,
        primaryScore: `${bid} pts`,
        secondaryDetail: isWinner ? '👑 Única ganadora' : isCollided ? '💥 Choque (anulada)' : 'Carta única',
        isWinner,
        sortRank: isCollided ? 0 : bid + 100,
        sortSecondary: bid,
      };
    }

    // simon_pipeline
    const simon = minigame.simonEntries?.[player.id];
    const rounds = simon?.completedRounds || 0;
    const steps = simon?.correctSteps || 0;
    const roundWord = rounds === 1 ? 'ronda' : 'rondas';
    return {
      player,
      primaryScore: `${rounds} ${roundWord}`,
      secondaryDetail: simon?.failed ? `${steps} pasos · 💥 Fallo` : `${steps} pasos`,
      isWinner,
      sortRank: rounds * 1000 + steps,
      sortSecondary: player.stars,
    };
  };

  const rankedPlayers = players
    .map(buildRankedEntry)
    .sort((a, b) => {
      if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
      if (b.sortRank !== a.sortRank) return b.sortRank - a.sortRank;
      return b.sortSecondary - a.sortSecondary;
    });

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

          {noWinner ? (
            <>
              <div className="text-4xl mb-2" aria-hidden="true">
                {minigame.type === 'planning_poker' ? '💥' : '🤝'}
              </div>
              <h2 id={titleId} className="text-2xl font-black text-white break-words max-w-full">
                {minigame.type === 'planning_poker' ? 'Sin ganador' : 'Sin puntuación'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {minigame.resultSummary || 'Nadie sumó puntos en esta ronda.'}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {winners.map((w) => (
                  <CharacterAvatar key={w.id} characterId={w.characterId} size="lg" />
                ))}
              </div>

              <h2
                id={titleId}
                className={`text-2xl font-black tracking-wide break-words max-w-full ${
                  iWon ? 'text-yellow-300' : 'text-white'
                }`}
              >
                {iWon ? (
                  <>
                    ¡GANASTE! <span aria-hidden="true">🎉</span>
                  </>
                ) : isTie ? (
                  `¡Empate: ${winners.map((w) => w.name).join(' y ')}!`
                ) : (
                  `¡Ganó ${winners[0]?.name}!`
                )}
              </h2>

              <div className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black uppercase shadow-lg">
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>+2 Estrellas</span>
              </div>

              {minigame.resultSummary && (
                <p className="mt-2 text-xs text-cyan-200 font-semibold">{minigame.resultSummary}</p>
              )}
            </>
          )}

          {/* Compact Top-3 Podium + Current Player Row if ranked #4+ */}
          <div className="mt-4 space-y-2 text-left">
            {(() => {
              const topThree = rankedPlayers.slice(0, 3);
              const myIdx = myPlayerId
                ? rankedPlayers.findIndex((e) => e.player.id === myPlayerId)
                : -1;
              const showOwnOutsideTop3 = myIdx >= 3;
              const rowsToShow = showOwnOutsideTop3
                ? [...topThree, rankedPlayers[myIdx]]
                : topThree;
              return rowsToShow.map((entry, idx) => {
                const displayRank = showOwnOutsideTop3 && idx === topThree.length ? myIdx + 1 : idx + 1;
                return (
                  <div
                    key={entry.player.id}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${
                      entry.isWinner
                        ? 'bg-amber-500/20 border-amber-400/60 text-white'
                        : entry.player.id === myPlayerId
                        ? 'bg-cyan-950/70 border-cyan-400/50 text-white'
                        : 'bg-slate-900/90 border-white/15 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-yellow-300 w-6 shrink-0">
                        #{displayRank}
                      </span>
                      <CharacterAvatar
                        characterId={entry.player.characterId}
                        size="sm"
                        showBorder={false}
                      />
                      <span className="text-xs font-bold truncate">{entry.player.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold text-amber-200">{entry.primaryScore}</div>
                      {entry.secondaryDetail && (
                        <div className="text-xs text-slate-300">{entry.secondaryDetail}</div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
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
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center p-4 pb-20 md:p-6 select-none font-game animate-fade-in motion-reduce:animate-none overflow-y-auto focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="my-auto w-full max-w-2xl rounded-3xl border-2 border-yellow-400/70 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-900/95 p-6 md:p-8 shadow-2xl flex flex-col items-center text-center animate-modal-spring motion-reduce:animate-none">
        {/* Top Trophy Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-200 text-xs font-black uppercase tracking-widest mb-4 shadow">
          <Trophy className="w-4 h-4 text-yellow-300" aria-hidden="true" />
          <span>
            {noWinner
              ? 'Minijuego Finalizado'
              : isTie
              ? '¡Empate en la Cima!'
              : '¡Ganador del Minijuego!'}
          </span>
        </div>

        {noWinner ? (
          <div className="my-4">
            <div className="text-5xl mb-3" aria-hidden="true">
              {minigame.type === 'planning_poker' ? '💥' : '🤝'}
            </div>
            <h2 id={titleId} className="text-3xl md:text-4xl font-black text-white">
              {minigame.type === 'planning_poker' ? 'Ronda sin ganador' : 'Ronda sin puntuación'}
            </h2>
            <p className="text-sm text-slate-200 mt-2 max-w-md mx-auto">
              {minigame.resultSummary || 'Ningún jugador registró puntuación en esta ocasión.'}
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
              className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-md break-words max-w-full"
            >
              {winners.map((w) => w.name).join(' & ')}
            </h2>

            <div className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>+2</span>
              <Star className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
              <span>Estrellas de Premio</span>
            </div>

            {minigame.resultSummary && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-cyan-400/40 text-cyan-200 text-xs font-bold">
                <Info className="w-3.5 h-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
                <span>{minigame.resultSummary}</span>
              </div>
            )}
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
                  <CharacterAvatar
                    characterId={entry.player.characterId}
                    size="sm"
                    showBorder={false}
                  />
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
                  <div className="text-sm font-black text-yellow-300">{entry.primaryScore}</div>
                  {entry.secondaryDetail && (
                    <div className="text-xs text-slate-300">{entry.secondaryDetail}</div>
                  )}
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
            className="mt-6 min-h-[44px] px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl hover:brightness-105 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Continuar al Tablero</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
