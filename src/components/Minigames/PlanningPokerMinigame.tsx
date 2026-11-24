import React, { useEffect, useId, useRef, useState } from 'react';
import { Lock, Clock, Sparkles, Flame } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { FIBONACCI_CARDS } from '@/constants/minigames';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface PlanningPokerProps {
  isController?: boolean;
}

export const PlanningPokerMinigame: React.FC<PlanningPokerProps> = ({ isController = false }) => {
  const { gameState, isHost, submitPokerBid, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [timeLeft, setTimeLeft] = useState(14);
  const [localBids, setLocalBids] = useState<Record<string, number>>({});
  const [isRevealing, setIsRevealing] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (minigame?.phase === 'playing') {
      setLocalBids({});
      setIsRevealing(false);
      finishedRef.current = false;
      dialogRef.current?.focus();
    } else if (minigame?.phase === 'instructions') {
      dialogRef.current?.focus();
    }
  }, [minigame?.phase]);

  // Countdown + Host dramatic card-flip reveal before transitioning to MinigameResultsOverlay
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const remaining = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      return remaining;
    };

    syncRemaining();

    const triggerHostReveal = () => {
      if (isController || !isHost || finishedRef.current) return;
      finishedRef.current = true;
      setIsRevealing(true);
      revealTimer = setTimeout(() => {
        finishMinigame();
      }, 1700);
    };

    const totalBids = Object.keys(minigame.pokerBids || {}).length;
    if (players.length > 0 && totalBids >= players.length) {
      triggerHostReveal();
      return () => {
        if (revealTimer) clearTimeout(revealTimer);
      };
    }

    const interval = setInterval(() => {
      const remaining = syncRemaining();
      const count = Object.keys(minigame.pokerBids || {}).length;
      if (remaining <= 0 || (players.length > 0 && count >= players.length)) {
        clearInterval(interval);
        triggerHostReveal();
      }
    }, 250);

    return () => {
      clearInterval(interval);
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [minigame?.phase, minigame?.endsAt, minigame?.pokerBids, players.length, isController, isHost, finishMinigame]);

  if (!minigame) return null;

  if (minigame.phase === 'results') {
    return <MinigameResultsOverlay isController={isController} />;
  }

  if (minigame.phase === 'roulette') {
    return null;
  }

  if (minigame.phase === 'instructions') {
    if (isController) {
      return (
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 bg-slate-950/95 overflow-y-auto flex flex-col items-center p-6 pb-20 text-center select-none font-game animate-fade-in motion-reduce:animate-none focus:outline-none"
        >
          <div className="my-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">🃏</span>
            </div>
            <span className="text-xs font-black text-emerald-300 uppercase tracking-widest mb-1">
              Planning Poker en Preparación
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Atento a la Pantalla Grande!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Prepara tu estrategia: las cartas repetidas chocan y quedan anuladas.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const bids = minigame.pokerBids || {};
  const myBid = bids[myPlayerId] ?? localBids[myPlayerId];
  const submittedCount = Object.keys(bids).length;

  // Reveal frequency calculation on Host during brief reveal transition
  const bidFreq: Record<number, number> = {};
  Object.values(bids).forEach((val) => {
    bidFreq[val] = (bidFreq[val] || 0) + 1;
  });
  const uniqueCards = Object.entries(bids)
    .filter(([, val]) => bidFreq[val] === 1)
    .map(([, val]) => val);
  const highestUniqueCard = uniqueCards.length > 0 ? Math.max(...uniqueCards) : null;

  const handleSelectCard = (cardVal: number) => {
    if (myBid !== undefined || minigame.phase !== 'playing' || timeLeft <= 0) return;
    setLocalBids((prev) => ({ ...prev, [myPlayerId]: cardVal }));
    submitPokerBid(myPlayerId, cardVal);
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col items-center p-4 focus:outline-none ${
        isController ? 'pb-20' : 'pb-20 md:pb-4'
      }`}
    >
      <div className="my-auto flex flex-col items-center w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-5 max-w-xl">
          <div className="text-xs font-game font-black uppercase tracking-widest text-emerald-300 mb-1">
            MINIJUEGO ESTRATÉGICO • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              🃏
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400">
              PLANNING POKER TRAICIONERO
            </span>
          </h2>
          <p className="mt-2 text-xs md:text-sm text-slate-200 font-semibold">
            Gana la carta <span className="text-yellow-300 font-black">MÁS ALTA</span> que nadie más haya elegido. ¡Las repetidas chocan!
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-emerald-400/40 text-xs font-bold text-slate-200">
            {isRevealing ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true">🎴</span>
                <span>¡Revelando cartas y comprobando choques...!</span>
              </span>
            ) : (
              <span>
                Cartas bloqueadas: {submittedCount} / {players.length} • Tiempo: {timeLeft}s
              </span>
            )}
          </div>
          {isRevealing && (
            <div role="status" aria-live="polite" className="sr-only">
              Revelando todas las cartas y comprobando choques.
            </div>
          )}
        </div>

        {/* Controller Card Deck */}
        {isController ? (
          myBid !== undefined ? (
            <div
              role="status"
              aria-live="polite"
              className="w-full max-w-sm p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-400/70 text-center shadow-2xl"
            >
              <div className="w-16 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-b from-emerald-500/30 to-teal-700/30 border-2 border-emerald-300 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                {myBid}
              </div>
              <div className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-300 uppercase">
                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Carta secreta bloqueada: {myBid} pts</span>
              </div>
              <p className="mt-2 text-xs text-slate-300 font-semibold">
                ¡Cruza los dedos para que nadie más la haya elegido! ({timeLeft}s)
              </p>
            </div>
          ) : (
            <div className="w-full max-w-sm grid grid-cols-3 gap-3">
              {FIBONACCI_CARDS.map((cardVal) => (
                <button
                  key={cardVal}
                  type="button"
                  aria-label={`Carta Fibonacci ${cardVal} puntos`}
                  onClick={() => handleSelectCard(cardVal)}
                  disabled={timeLeft <= 0}
                  className="min-h-[84px] rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-400/50 hover:border-yellow-300 shadow-xl flex flex-col items-center justify-center gap-1 transition-all hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
                >
                  <span className="text-3xl font-black text-white">{cardVal}</span>
                  <span className="text-xs font-bold text-emerald-300">PTS</span>
                </button>
              ))}
            </div>
          )
        ) : (
          /* Host Secret Cards Table */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-5 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {players.map((player) => {
                const bid = bids[player.id];
                const hasPicked = bid !== undefined;
                const isCollided = isRevealing && hasPicked && (bidFreq[bid] || 0) > 1;
                const isBestUnique =
                  isRevealing && hasPicked && !isCollided && bid === highestUniqueCard;

                return (
                  <div
                    key={player.id}
                    className={`rounded-2xl p-3.5 border-2 flex flex-col items-center justify-between gap-2.5 text-center transition-all duration-300 motion-reduce:transition-none motion-reduce:scale-100 ${
                      isBestUnique
                        ? 'bg-amber-500/20 border-yellow-300 ring-2 ring-yellow-400/50 scale-[1.03]'
                        : isCollided
                        ? 'bg-rose-950/70 border-rose-500/70 opacity-85'
                        : hasPicked
                        ? 'bg-emerald-950/60 border-emerald-400/60'
                        : 'bg-slate-800/80 border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full justify-center">
                      <CharacterAvatar
                        characterId={player.characterId}
                        size="sm"
                        showBorder={false}
                      />
                      <span className="text-xs font-extrabold text-white truncate">
                        {player.name}
                      </span>
                    </div>

                    {isRevealing ? (
                      hasPicked ? (
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-black ${
                              isCollided
                                ? 'bg-rose-900/80 border-rose-400 text-rose-200 line-through'
                                : isBestUnique
                                ? 'bg-yellow-400 border-white text-slate-950'
                                : 'bg-slate-800 border-emerald-400 text-white'
                            }`}
                          >
                            {bid}
                          </div>
                          <span className="mt-1.5 text-xs font-black flex items-center gap-1">
                            {isCollided ? (
                              <span className="text-rose-300 inline-flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5" aria-hidden="true" /> CHOQUE
                              </span>
                            ) : isBestUnique ? (
                              <span className="text-yellow-300 inline-flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> ¡ÚNICA TOP!
                              </span>
                            ) : (
                              <span className="text-emerald-300">Única</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center text-xs font-bold text-slate-400">
                          Sin carta
                        </div>
                      )
                    ) : (
                      <div
                        className={`w-14 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${
                          hasPicked
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-dashed border-slate-600 text-slate-400'
                        }`}
                      >
                        {hasPicked ? (
                          <Lock className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <Clock className="w-5 h-5" aria-hidden="true" />
                        )}
                      </div>
                    )}

                    {!isRevealing && (
                      <span
                        className={`text-xs font-bold ${
                          hasPicked ? 'text-emerald-300' : 'text-slate-300'
                        }`}
                      >
                        {hasPicked ? 'Lista' : 'Pensando...'}
                      </span>
                    )}
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
