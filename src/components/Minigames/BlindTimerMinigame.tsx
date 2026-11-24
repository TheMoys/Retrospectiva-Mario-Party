import React, { useEffect, useId, useRef, useState } from 'react';
import { Timer, Rocket, CheckCircle2, Clock } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { CHARACTERS } from '@/constants/characters';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface BlindTimerProps {
  isController?: boolean;
}

export const BlindTimerMinigame: React.FC<BlindTimerProps> = ({ isController = false }) => {
  const { gameState, isHost, submitBlindTimer, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const targetMs = minigame?.targetMs || 7000;
  const hideAfterMs = minigame?.hideAfterMs || 2000;

  const [timeLeft, setTimeLeft] = useState(13);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [clockHidden, setClockHidden] = useState(false);
  const [localSubmittedMap, setLocalSubmittedMap] = useState<Record<string, number>>({});
  const startPerfRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);

  // Reset local tracking when a new blind_timer session enters playing
  useEffect(() => {
    if (minigame?.phase === 'playing') {
      startPerfRef.current = performance.now();
      setElapsedMs(0);
      setClockHidden(false);
      setLocalSubmittedMap({});
      finishedRef.current = false;
      dialogRef.current?.focus();
    } else if (minigame?.phase === 'instructions') {
      dialogRef.current?.focus();
    }
  }, [minigame?.phase, minigame?.targetMs]);

  // High-resolution local timer (hides exact digits at hideAfterMs)
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    const ticker = setInterval(() => {
      const nowElapsed = Math.max(0, performance.now() - startPerfRef.current);
      if (nowElapsed >= hideAfterMs) {
        setClockHidden(true);
        clearInterval(ticker);
      } else {
        setElapsedMs(nowElapsed);
      }
    }, 50);

    return () => clearInterval(ticker);
  }, [minigame?.phase, hideAfterMs]);

  // Authoritative Host timeout + all-players-submitted finish trigger
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const remaining = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      return remaining;
    };

    syncRemaining();

    const submittedCount = Object.keys(minigame.blindEntries || {}).length;
    if (!isController && isHost && players.length > 0 && submittedCount >= players.length && !finishedRef.current) {
      finishTimer = setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          finishMinigame();
        }
      }, 1200);
      return () => {
        if (finishTimer) clearTimeout(finishTimer);
      };
    }

    const interval = setInterval(() => {
      const remaining = syncRemaining();
      const count = Object.keys(minigame.blindEntries || {}).length;
      if (remaining <= 0 || (players.length > 0 && count >= players.length)) {
        clearInterval(interval);
        if (!isController && isHost && !finishTimer && !finishedRef.current) {
          finishTimer = setTimeout(() => {
            if (!finishedRef.current) {
              finishedRef.current = true;
              finishMinigame();
            }
          }, 1200);
        }
      }
    }, 200);

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [
    minigame?.phase,
    minigame?.endsAt,
    minigame?.blindEntries,
    players.length,
    isController,
    isHost,
    finishMinigame,
  ]);

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
            <div className="w-16 h-16 rounded-3xl bg-violet-500/20 border-2 border-violet-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">⏱️</span>
            </div>
            <span className="text-xs font-black text-violet-300 uppercase tracking-widest mb-1">
              Deploy a Ciegas en Preparación
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Atento a la Pantalla Grande!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Mira el tiempo objetivo en la pantalla grande. ¡Prepara tu cuenta mental!
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const targetSecondsStr = (targetMs / 1000).toFixed(2);
  const myServerEntry = minigame.blindEntries?.[myPlayerId];
  const myLocalMs = localSubmittedMap[myPlayerId];
  const myRecordedMs = myServerEntry?.elapsedMs ?? myLocalMs;
  const hasDeployed = myRecordedMs !== undefined;

  const handleDeploy = () => {
    if (hasDeployed || minigame.phase !== 'playing' || timeLeft <= 0) return;
    const exactElapsed = Math.max(0, Math.round(performance.now() - startPerfRef.current));
    setLocalSubmittedMap((prev) => ({ ...prev, [myPlayerId]: exactElapsed }));
    submitBlindTimer(myPlayerId, exactElapsed);
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
        <div className="text-center mb-5">
          <div className="text-xs font-game font-black uppercase tracking-widest text-violet-300 mb-1">
            MINIJUEGO DE PRECISIÓN • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              ⏱️
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-300">
              DEPLOY A CIEGAS
            </span>
          </h2>

          {/* Target Pill */}
          <div className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-violet-950/90 border-2 border-violet-400/70 shadow-xl">
            <Timer className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
            <span className="text-sm md:text-base font-black text-white">
              META EXACTA:{' '}
              <span className="font-mono text-amber-300 text-lg md:text-2xl tabular-nums">
                {targetSecondsStr} s
              </span>
            </span>
          </div>

          {/* Blind Clock Box (no aria-live to prevent 50ms tick spam) */}
          <div
            className={`mt-3 mx-auto w-fit px-6 py-2.5 rounded-2xl border-2 font-mono text-2xl md:text-3xl font-black tabular-nums transition-colors motion-reduce:transition-none ${
              clockHidden
                ? 'bg-slate-900 border-fuchsia-400/60 text-fuchsia-300'
                : 'bg-slate-900 border-emerald-400/60 text-emerald-300'
            }`}
          >
            {clockHidden ? '??.?? s' : `${(elapsedMs / 1000).toFixed(2)} s`}
          </div>

          <p role="status" aria-live="polite" className="text-xs text-slate-300 mt-2 font-semibold">
            {clockHidden
              ? '¡Reloj oculto! Sigue contando mentalmente y dispara en el momento exacto.'
              : 'Memoriza el ritmo antes de que desaparezca a los 2.00 s...'}
          </p>
        </div>

        {/* Controller vs Host View */}
        {isController ? (
          <div className="flex flex-col items-center justify-center w-full max-w-sm">
            {hasDeployed ? (
              <div
                role="status"
                aria-live="polite"
                className="w-full p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-400/70 text-center shadow-2xl"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
                <div className="text-sm font-black uppercase tracking-wider text-emerald-300">
                  ¡Deploy Enviado!
                </div>
                <div className="mt-2 font-mono text-3xl font-black text-white tabular-nums">
                  {(myRecordedMs / 1000).toFixed(2)} s
                </div>
                <p className="mt-2 text-xs text-slate-300 font-semibold">
                  Esperando al resto del equipo ({timeLeft}s)...
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Lanzar deploy ahora"
                  onClick={handleDeploy}
                  disabled={timeLeft <= 0}
                  className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-violet-900 via-purple-700 to-fuchsia-700 border-4 border-white/60 shadow-2xl flex flex-col items-center justify-center active:scale-95 transition-transform duration-75 motion-reduce:transition-none motion-reduce:active:scale-100 select-none cursor-pointer disabled:from-slate-800 disabled:via-slate-800 disabled:to-slate-800 disabled:text-slate-300 disabled:border-slate-600 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300"
                  style={{
                    boxShadow: '0 16px 40px rgba(139, 92, 246, 0.5), inset 0 -8px 0 rgba(46, 16, 101, 0.7)',
                  }}
                >
                  <Rocket className="w-14 h-14 text-white drop-shadow mb-2" aria-hidden="true" />
                  <span className="text-sm font-black text-white uppercase tracking-wider px-3 text-center">
                    ¡LANZAR DEPLOY!
                  </span>
                </button>
                <div className="mt-4 text-xs font-bold text-slate-300">
                  Solo tienes 1 disparo • Tiempo límite: {timeLeft}s
                </div>
              </>
            )}
          </div>
        ) : (
          /* Host Live Status Grid (Hides exact times until final reveal) */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              <span>Estado de los Deploys</span>
              <span className="text-amber-300">
                {Object.keys(minigame.blindEntries || {}).length} / {players.length} listos • {timeLeft}s
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {players.map((player) => {
                const char = CHARACTERS[player.characterId] || CHARACTERS.mario;
                const isDone = Boolean(minigame.blindEntries?.[player.id]);

                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-3 border flex items-center gap-3 transition-colors motion-reduce:transition-none ${
                      isDone
                        ? 'bg-emerald-500/20 border-emerald-400/70'
                        : 'bg-slate-800/90 border-white/15'
                    }`}
                  >
                    <CharacterAvatar characterId={player.characterId} size="sm" showBorder={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">
                        {player.name}
                      </div>
                      <div
                        className="text-xs font-bold flex items-center gap-1 mt-0.5"
                        style={{ color: isDone ? '#6ee7b7' : char.neonColor }}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>¡Deploy listo!</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Contando...</span>
                          </>
                        )}
                      </div>
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
