import React, { useEffect, useId, useRef, useState } from 'react';
import { DoorOpen, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { computeMeetingPoints } from '@/constants/minigames';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface ChickenMeetingProps {
  isController?: boolean;
}

export const ChickenMeetingMinigame: React.FC<ChickenMeetingProps> = ({
  isController = false,
}) => {
  const { gameState, isHost, submitMeetingExit, triggerMeetingCrash, finishMinigame, myPlayerId } =
    useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const crashAtMs = minigame?.meetingCrashAtMs || 7000;
  const startedAt = minigame?.meetingStartedAt || Date.now();
  const crashed = Boolean(minigame?.meetingCrashed);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [localExitedMap, setLocalExitedMap] = useState<Record<string, number>>({});
  const crashedRef = useRef(false);
  const finishedRef = useRef(false);

  const isDialogActive =
    Boolean(minigame) &&
    minigame?.phase !== 'roulette' &&
    minigame?.phase !== 'results' &&
    !(minigame?.phase === 'instructions' && !isController);

  useDialogFocusTrap(dialogRef, isDialogActive);

  useEffect(() => {
    if (minigame?.phase === 'playing') {
      setElapsedMs(0);
      setLocalExitedMap({});
      crashedRef.current = false;
      finishedRef.current = false;
    }
  }, [minigame?.phase]);

  // Smooth local pot ticker (NO aria-live to prevent SR flooding)
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing' || crashed) return;

    const tick = setInterval(() => {
      const nowElapsed = Math.max(0, Date.now() - startedAt);
      setElapsedMs(nowElapsed);
      if (!isController && isHost && nowElapsed >= crashAtMs && !crashedRef.current) {
        crashedRef.current = true;
        clearInterval(tick);
        triggerMeetingCrash();
      }
    }, 80);

    return () => clearInterval(tick);
  }, [minigame?.phase, crashed, startedAt, crashAtMs, isController, isHost, triggerMeetingCrash]);

  // Host ends meeting smoothly if everyone escaped early OR 1.6s after crash
  useEffect(() => {
    if (isController || !isHost || minigame?.phase !== 'playing') return;

    const allResolved =
      players.length > 0 && players.every((p) => Boolean(minigame.meetingExits?.[p.id]));

    if ((crashed || allResolved) && !finishedRef.current) {
      const finishTimer = setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          finishMinigame();
        }
      }, crashed ? 1600 : 1200);
      return () => clearTimeout(finishTimer);
    }
  }, [
    isController,
    isHost,
    minigame?.phase,
    minigame?.meetingExits,
    crashed,
    players,
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
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">🚪</span>
            </div>
            <span className="text-xs font-black text-teal-300 uppercase tracking-widest mb-1">
              Call en Curso
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Cuidado con el Alcance Extra!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Cuanto más aguantes más puntos sumas, pero si la sala colapsa te llevas 0.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const currentPot = crashed ? 0 : computeMeetingPoints(elapsedMs);
  const myServerExit = minigame.meetingExits?.[myPlayerId];
  const myLocalMs = localExitedMap[myPlayerId];
  const hasExited = Boolean(myServerExit || myLocalMs !== undefined);

  const tensionQuote = crashed
    ? { icon: '💥', text: '¡"Aprovechando que estamos todos..." — SALA COLAPSADA!' }
    : elapsedMs < 2500
    ? { icon: '💬', text: '"Esto es solo una duda rápida de 5 minutitos..."' }
    : elapsedMs < 5000
    ? { icon: '😅', text: '"Oye, ¿y si metemos también un filtro por IA aquí?"' }
    : { icon: '😰', text: '"Es un cambiocito mínimo para mañana en producción..."' };

  const handleExitMeeting = () => {
    if (hasExited || crashed || minigame.phase !== 'playing') return;
    const nowElapsed = Math.max(0, Date.now() - startedAt);
    setLocalExitedMap((prev) => ({ ...prev, [myPlayerId]: nowElapsed }));
    submitMeetingExit(myPlayerId, nowElapsed);
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
          <div className="text-xs font-game font-black uppercase tracking-widest text-teal-300 mb-1">
            MINIJUEGO DE RIESGO • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              🚪
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300">
              LA REUNIÓN INTERMINABLE
            </span>
          </h2>

          {/* Rising Pot Counter */}
          <div
            className={`mt-3 mx-auto w-fit px-6 py-3 rounded-2xl border-2 font-mono font-black shadow-2xl ${
              crashed
                ? 'bg-rose-950/90 border-rose-400 text-rose-300'
                : 'bg-slate-900 border-teal-400/70 text-yellow-300'
            }`}
          >
            <div className="text-xs uppercase font-sans tracking-wider text-slate-300 mb-0.5">
              {crashed ? 'Reunión secuestrada' : 'Bote acumulado si sales ya'}
            </div>
            <div className="text-3xl md:text-4xl tabular-nums">
              {crashed ? (
                <>
                  <span aria-hidden="true" className="mr-1.5">
                    💥
                  </span>
                  <span>0 pts</span>
                </>
              ) : (
                `+${currentPot} pts`
              )}
            </div>
          </div>

          <p className="mt-2 text-xs md:text-sm font-semibold text-slate-200 max-w-md mx-auto">
            <span aria-hidden="true" className="mr-1.5">
              {tensionQuote.icon}
            </span>
            <span>{tensionQuote.text}</span>
          </p>
        </div>

        {/* Crash screen-reader announcement */}
        {crashed && (
          <div role="status" aria-live="polite" className="sr-only">
            La reunión colapsó. Quienes no salieron quedan con 0 puntos.
          </div>
        )}

        {isController ? (
          <div className="w-full max-w-sm flex flex-col items-center">
            {myServerExit ? (
              <div
                role="status"
                aria-live="polite"
                className={`w-full p-6 rounded-3xl border-2 text-center shadow-2xl ${
                  myServerExit.crashed
                    ? 'bg-rose-950/85 border-rose-400/70'
                    : 'bg-slate-900/95 border-emerald-400/70'
                }`}
              >
                {myServerExit.crashed ? (
                  <>
                    <Flame className="w-12 h-12 text-rose-400 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-base font-black text-rose-200">
                      ¡Te atrapó la reunión!
                    </div>
                    <div className="text-2xl font-mono font-black text-white mt-1">0 pts</div>
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      className="w-12 h-12 text-emerald-400 mx-auto mb-2"
                      aria-hidden="true"
                    />
                    <div className="text-sm font-black uppercase text-emerald-300">
                      ¡Escapaste a salvo!
                    </div>
                    <div className="text-3xl font-mono font-black text-white mt-1 tabular-nums">
                      +{myServerExit.points} pts
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">
                      Saliste a los {(myServerExit.exitedAtMs / 1000).toFixed(2)} s.
                    </p>
                  </>
                )}
              </div>
            ) : hasExited ? (
              <div
                role="status"
                aria-live="polite"
                className="w-full p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-400/70 text-center shadow-2xl"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
                <div className="text-sm font-black text-emerald-300">Saliendo de la call...</div>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Salir de la reunión ahora"
                onClick={handleExitMeeting}
                disabled={crashed}
                className="w-full min-h-[120px] rounded-3xl bg-gradient-to-tr from-emerald-900 via-emerald-800 to-teal-700 border-4 border-emerald-300/70 shadow-2xl flex flex-col items-center justify-center gap-2 text-white active:scale-95 transition-transform motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer disabled:from-slate-800 disabled:via-slate-800 disabled:to-slate-800 disabled:text-slate-300 disabled:border-slate-600 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
              >
                <DoorOpen className="w-11 h-11 text-white" aria-hidden="true" />
                <span className="text-base font-black uppercase tracking-wider px-4">
                  ¡SALIR DE LA REUNIÓN!
                </span>
              </button>
            )}
          </div>
        ) : (
          /* Host Live Escapers Status */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <span>Estado de la Call</span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                Colapso aleatorio oculto
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => {
                const exit = minigame.meetingExits?.[player.id];
                const isSafe = Boolean(exit && !exit.crashed);
                const isBoom = Boolean(exit && exit.crashed);

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      isBoom
                        ? 'bg-rose-950/65 border-rose-400/70'
                        : isSafe
                        ? 'bg-emerald-950/65 border-emerald-400/70'
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
                        <div className="text-xs font-semibold text-slate-300 inline-flex items-center gap-1">
                          {isBoom ? (
                            <>
                              <span aria-hidden="true">💥</span>
                              <span>Atrapado en la call</span>
                            </>
                          ) : isSafe ? (
                            <>
                              <span aria-hidden="true">🚪</span>
                              <span>Salió ({(exit!.exitedAtMs / 1000).toFixed(2)}s)</span>
                            </>
                          ) : (
                            <>
                              <span aria-hidden="true">⏳</span>
                              <span>Sigue aguantando...</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-black text-yellow-300 shrink-0 tabular-nums">
                      {exit ? `${exit.points} pts` : `${currentPot} pts`}
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
