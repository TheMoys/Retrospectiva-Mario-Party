import React, { useEffect, useId, useRef, useState } from 'react';
import { Scissors, ShieldCheck, Skull } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { DEFUSE_CABLES, DEFUSE_CABLE_MAP } from '@/constants/minigames';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { CableColorId } from '@/types/game';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface DefuseCableProps {
  isController?: boolean;
}

export const DefuseCableMinigame: React.FC<DefuseCableProps> = ({ isController = false }) => {
  const { gameState, isHost, submitDefuseChoice, advanceDefuseRound, finishMinigame, myPlayerId } =
    useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const [roundTimeLeft, setRoundTimeLeft] = useState(8);
  const [localPicks, setLocalPicks] = useState<Record<string, CableColorId>>({});
  const revealedRoundRef = useRef<number>(-1);
  const finishedRef = useRef<boolean>(false);

  const rounds = minigame?.defuseRounds || [];
  const roundIndex = minigame?.defuseRoundIndex ?? 0;
  const isRevealing = Boolean(minigame?.defuseRoundRevealing);
  const roundEndsAt = minigame?.defuseRoundEndsAt || minigame?.endsAt || Date.now();
  const currentRound = rounds[roundIndex];

  const isDialogActive =
    Boolean(minigame) &&
    minigame?.phase !== 'roulette' &&
    minigame?.phase !== 'results' &&
    !(minigame?.phase === 'instructions' && !isController);

  useDialogFocusTrap(dialogRef, isDialogActive);

  useEffect(() => {
    if (minigame?.phase === 'playing') {
      setLocalPicks({});
      revealedRoundRef.current = -1;
      finishedRef.current = false;
    }
  }, [minigame?.phase]);

  // Clear optimistic pick cache whenever advancing rounds
  useEffect(() => {
    setLocalPicks({});
  }, [roundIndex]);

  // Round countdown & Host auto-reveal when all players picked or time expires
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing' || isRevealing) return;

    const syncRoundTimer = () => {
      const rem = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
      setRoundTimeLeft(rem);
      return rem;
    };

    const allPicked =
      players.length > 0 &&
      players.every((p) => minigame.defuseChoices?.[p.id]?.[roundIndex] !== undefined);

    if (!isController && isHost && allPicked && revealedRoundRef.current !== roundIndex) {
      const t = setTimeout(() => {
        if (revealedRoundRef.current !== roundIndex) {
          revealedRoundRef.current = roundIndex;
          advanceDefuseRound('reveal');
        }
      }, 350);
      return () => clearTimeout(t);
    }

    const rem0 = syncRoundTimer();
    if (!isController && isHost && rem0 <= 0 && revealedRoundRef.current !== roundIndex) {
      revealedRoundRef.current = roundIndex;
      advanceDefuseRound('reveal');
      return;
    }

    const interval = setInterval(() => {
      const rem = syncRoundTimer();
      const pickedNow =
        players.length > 0 &&
        players.every((p) => minigame.defuseChoices?.[p.id]?.[roundIndex] !== undefined);
      if ((rem <= 0 || pickedNow) && !isController && isHost && revealedRoundRef.current !== roundIndex) {
        clearInterval(interval);
        revealedRoundRef.current = roundIndex;
        advanceDefuseRound('reveal');
      }
    }, 200);

    return () => clearInterval(interval);
  }, [
    minigame?.phase,
    minigame?.defuseChoices,
    roundIndex,
    roundEndsAt,
    isRevealing,
    players,
    isController,
    isHost,
    advanceDefuseRound,
  ]);

  // Host transitions from round reveal -> next round OR finishMinigame after Round 3
  useEffect(() => {
    if (isController || !isHost || minigame?.phase !== 'playing' || !isRevealing) return;

    const revealTimer = setTimeout(() => {
      if (roundIndex + 1 < rounds.length) {
        advanceDefuseRound('next');
      } else if (!finishedRef.current) {
        finishedRef.current = true;
        finishMinigame();
      }
    }, 1500);

    return () => clearTimeout(revealTimer);
  }, [
    isController,
    isHost,
    minigame?.phase,
    isRevealing,
    roundIndex,
    rounds.length,
    advanceDefuseRound,
    finishMinigame,
  ]);

  if (!minigame || minigame.phase === 'roulette') return null;

  if (minigame.phase === 'results') {
    return <MinigameResultsOverlay isController={isController} />;
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
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">✂️</span>
            </div>
            <span className="text-xs font-black text-rose-300 uppercase tracking-widest mb-1">
              Desactivación en Preparación
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Prepara tus Alicates!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              3 rondas: 1 cable detona un P0 (0 pts) y los otros 3 suman +1, +2 o +3 puntos.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const getPlayerTotalScore = (playerId: string): number => {
    let sum = 0;
    const playerChoices = minigame.defuseChoices?.[playerId] || {};
    rounds.forEach((cfg, idx) => {
      if (idx < roundIndex || (idx === roundIndex && isRevealing)) {
        const picked = playerChoices[idx];
        if (picked) sum += cfg.pointsByCable[picked] || 0;
      }
    });
    return sum;
  };

  const myPickKey = `${myPlayerId}:${roundIndex}`;
  const myChoice = minigame.defuseChoices?.[myPlayerId]?.[roundIndex] ?? localPicks[myPickKey];
  const roundCount = rounds.length || 3;

  const handleCutCable = (cableId: CableColorId) => {
    if (myChoice || isRevealing || minigame.phase !== 'playing') return;
    setLocalPicks((prev) => ({ ...prev, [myPickKey]: cableId }));
    submitDefuseChoice(myPlayerId, roundIndex, cableId);
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
        <div className="text-center mb-4">
          <div className="text-xs font-game font-black uppercase tracking-widest text-rose-300 mb-1">
            MINIJUEGO DE TENSIÓN • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              ✂️
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-300 to-yellow-300">
              CORTA EL CABLE P0
            </span>
          </h2>
          <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-rose-400/50 text-xs font-bold text-slate-100">
            <span>
              Ronda {roundIndex + 1} / {roundCount}
            </span>
            <span>·</span>
            {isRevealing ? (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">💥</span>
                <span>¡Revelando cables!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true">⏱️</span>
                <span>{roundTimeLeft}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Controller vs Host View */}
        {isController ? (
          <div className="w-full max-w-sm">
            <div className="mb-3 px-4 py-2 rounded-xl bg-slate-900/95 border border-white/15 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Tu acumulado:</span>
              <span className="text-yellow-300 font-black tabular-nums">
                {getPlayerTotalScore(myPlayerId)} pts
              </span>
            </div>

            {isRevealing && currentRound ? (
              <div
                role="status"
                aria-live="polite"
                className="p-5 rounded-3xl bg-slate-900/95 border-2 border-amber-400/60 text-center shadow-2xl"
              >
                {myChoice ? (
                  currentRound.bombCable === myChoice ? (
                    <>
                      <Skull className="w-12 h-12 text-rose-400 mx-auto mb-2" aria-hidden="true" />
                      <div className="text-lg font-black text-rose-300">
                        ¡CABLE BOMBA P0! (+0 pts)
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Cortaste el cable {DEFUSE_CABLE_MAP[myChoice].label} y cayó producción.
                      </p>
                    </>
                  ) : (
                    <>
                      <ShieldCheck
                        className="w-12 h-12 text-emerald-400 mx-auto mb-2"
                        aria-hidden="true"
                      />
                      <div className="text-lg font-black text-emerald-300">
                        ¡CABLE SEGURO! +{currentRound.pointsByCable[myChoice]} pts
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        La bomba era el cable {DEFUSE_CABLE_MAP[currentRound.bombCable].label}.
                      </p>
                    </>
                  )
                ) : (
                  <div className="text-sm font-bold text-slate-300">
                    Sin corte en esta ronda (+0 pts).
                  </div>
                )}
              </div>
            ) : myChoice ? (
              <div
                role="status"
                aria-live="polite"
                className="p-6 rounded-3xl bg-slate-900/95 border-2 border-cyan-400/60 text-center shadow-2xl"
              >
                <Scissors className="w-10 h-10 text-cyan-300 mx-auto mb-2" aria-hidden="true" />
                <div className="text-sm font-black text-white uppercase">
                  Cable {DEFUSE_CABLE_MAP[myChoice].label} cortado
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  Esperando al resto del equipo para revelar la bomba...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {DEFUSE_CABLES.map((cable) => (
                  <button
                    key={cable.id}
                    type="button"
                    data-cable-id={cable.id}
                    aria-label={`Cortar cable ${cable.label}`}
                    onClick={() => handleCutCable(cable.id)}
                    className={`min-h-[88px] p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${cable.buttonClass}`}
                  >
                    <div className={`w-12 h-2 rounded-full ${cable.wireClass}`} aria-hidden="true" />
                    <div className="flex items-center gap-1.5 text-sm font-black">
                      <span aria-hidden="true">{cable.emoji}</span>
                      <span>{cable.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Host TV Bomb & Score Matrix (2x2 on narrow mobile, 4-cols on sm+) */
          <div className="w-full space-y-4">
            {/* 4 Cables Board Reveal Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/95 border border-white/15 rounded-2xl p-3.5 shadow-xl">
              {DEFUSE_CABLES.map((cable) => {
                const isBomb = isRevealing && currentRound?.bombCable === cable.id;
                const pts = currentRound?.pointsByCable[cable.id] ?? 0;

                return (
                  <div
                    key={cable.id}
                    className={`rounded-xl p-2.5 border text-center flex flex-col items-center gap-1.5 ${
                      isRevealing
                        ? isBomb
                          ? 'bg-rose-950/90 border-rose-400 text-rose-200'
                          : 'bg-emerald-950/80 border-emerald-400/70 text-emerald-200'
                        : 'bg-slate-950/90 border-white/15 text-slate-200'
                    }`}
                  >
                    <div className={`w-full h-2.5 rounded-full ${cable.wireClass}`} aria-hidden="true" />
                    <span className="text-xs font-black">{cable.label}</span>
                    <span className="text-xs font-extrabold inline-flex items-center gap-1">
                      {isRevealing ? (
                        isBomb ? (
                          <>
                            <span aria-hidden="true">💥</span>
                            <span>BOMBA</span>
                          </>
                        ) : (
                          `+${pts} pts`
                        )
                      ) : (
                        <>
                          <span aria-hidden="true">❓</span>
                          <span>Secreto</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {isRevealing && (
              <div role="status" aria-live="polite" className="sr-only">
                Cables revelados de la ronda {roundIndex + 1}.
              </div>
            )}

            {/* Players Grid */}
            <div className="bg-slate-900/90 border border-white/15 rounded-2xl p-4 shadow-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => {
                const chosen = minigame.defuseChoices?.[player.id]?.[roundIndex];
                const total = getPlayerTotalScore(player.id);
                const hitBomb = Boolean(
                  isRevealing && chosen && currentRound?.bombCable === chosen
                );
                const roundPts =
                  isRevealing && chosen && currentRound ? currentRound.pointsByCable[chosen] : null;

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      hitBomb
                        ? 'bg-rose-950/60 border-rose-400/70'
                        : isRevealing && roundPts
                        ? 'bg-emerald-950/60 border-emerald-400/70'
                        : chosen
                        ? 'bg-cyan-950/50 border-cyan-400/50'
                        : 'bg-slate-800/90 border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CharacterAvatar
                        characterId={player.characterId}
                        size="sm"
                        showBorder={false}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white truncate">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-300 font-semibold inline-flex items-center gap-1">
                          {isRevealing ? (
                            chosen ? (
                              hitBomb ? (
                                <>
                                  <span aria-hidden="true">💥</span>
                                  <span>{DEFUSE_CABLE_MAP[chosen].label} (+0)</span>
                                </>
                              ) : (
                                <>
                                  <span aria-hidden="true">✅</span>
                                  <span>
                                    {DEFUSE_CABLE_MAP[chosen].label} (+{roundPts})
                                  </span>
                                </>
                              )
                            ) : (
                              <span>Sin corte</span>
                            )
                          ) : chosen ? (
                            <>
                              <span aria-hidden="true">✂️</span>
                              <span>Listo</span>
                            </>
                          ) : (
                            <>
                              <span aria-hidden="true">⏳</span>
                              <span>Eligiendo...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-black text-yellow-300 shrink-0 tabular-nums">
                      {total} pts
                    </div>
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
