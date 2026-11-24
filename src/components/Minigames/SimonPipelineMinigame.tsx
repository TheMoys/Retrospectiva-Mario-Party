import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, Flame, Trophy } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { PIPELINE_STEPS, PIPELINE_STEP_MAP } from '@/constants/minigames';
import { PipelineStepId } from '@/types/game';
import { sounds } from '@/audio/soundEffects';
import { CharacterAvatar } from '@/components/Common/CharacterAvatar';
import { MinigameResultsOverlay } from './MinigameResultsOverlay';

interface SimonPipelineProps {
  isController?: boolean;
}

const MAX_ROUNDS = 8; // Start with 3 steps -> Round 8 has 10 steps
const START_LENGTH = 3;

export const SimonPipelineMinigame: React.FC<SimonPipelineProps> = ({ isController = false }) => {
  const { gameState, isHost, submitSimonProgress, finishMinigame, myPlayerId } = useGame();
  const { minigame, players } = gameState;
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const sequence = minigame?.pipelineSequence || [];
  const serverEntry = minigame?.simonEntries?.[myPlayerId];

  const [timeLeft, setTimeLeft] = useState(28);
  const [roundIdx, setRoundIdx] = useState(0); // 0-based (Round 1 = 3 steps)
  const [subPhase, setSubPhase] = useState<'watching' | 'input' | 'round_clear' | 'failed' | 'completed'>('watching');
  const [litStepId, setLitStepId] = useState<PipelineStepId | null>(null);
  const [userInputIdx, setUserInputIdx] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const playStartPerfRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);

  // Sync local state cleanly whenever entering playing or switching player in Demo Mode
  useEffect(() => {
    if (minigame?.phase === 'instructions') {
      dialogRef.current?.focus();
      return;
    }
    if (minigame?.phase !== 'playing') return;

    dialogRef.current?.focus();
    finishedRef.current = false;
    if (playStartPerfRef.current === 0) {
      playStartPerfRef.current = performance.now();
    }

    if (serverEntry?.failed) {
      setRoundIdx(serverEntry.completedRounds);
      setTotalCorrect(serverEntry.correctSteps);
      setSubPhase('failed');
      setLitStepId(null);
    } else if ((serverEntry?.completedRounds || 0) >= MAX_ROUNDS) {
      setRoundIdx(MAX_ROUNDS);
      setTotalCorrect(serverEntry?.correctSteps || 0);
      setSubPhase('completed');
      setLitStepId(null);
    } else {
      setRoundIdx(serverEntry?.completedRounds || 0);
      setTotalCorrect(serverEntry?.correctSteps || 0);
      setUserInputIdx(0);
      setSubPhase('watching');
      setLitStepId(null);
    }
  }, [minigame?.phase, myPlayerId]);

  useEffect(() => {
    if (minigame?.phase !== 'playing') {
      playStartPerfRef.current = 0;
    }
  }, [minigame?.phase]);

  // Playback sequence during 'watching' subPhase on Controller
  useEffect(() => {
    if (!isController || minigame?.phase !== 'playing' || subPhase !== 'watching') return;

    const roundLength = Math.min(sequence.length, START_LENGTH + roundIdx);
    if (roundLength === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    setUserInputIdx(0);
    setLitStepId(null);

    let offsetMs = 260;
    for (let i = 0; i < roundLength; i++) {
      const stepId = sequence[i];
      const def = PIPELINE_STEP_MAP[stepId];

      timers.push(
        setTimeout(() => {
          setLitStepId(stepId);
          sounds.playTone(def.freq, 0.24);
        }, offsetMs)
      );

      offsetMs += 380;

      timers.push(
        setTimeout(() => {
          setLitStepId(null);
        }, offsetMs)
      );

      offsetMs += 150;
    }

    timers.push(
      setTimeout(() => {
        setLitStepId(null);
        setSubPhase('input');
      }, offsetMs)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isController, minigame?.phase, subPhase, roundIdx, sequence]);

  // Host authoritative timer + all players failed/completed check
  useEffect(() => {
    if (!minigame || minigame.phase !== 'playing') return;

    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const syncRemaining = () => {
      const remaining = Math.max(0, Math.ceil((minigame.endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      return remaining;
    };

    syncRemaining();

    const allDone =
      players.length > 0 &&
      players.every((p) => {
        const entry = minigame.simonEntries?.[p.id];
        return Boolean(entry && (entry.failed || entry.completedRounds >= MAX_ROUNDS));
      });

    if (!isController && isHost && allDone && !finishedRef.current) {
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
      const everyoneEnded =
        players.length > 0 &&
        players.every((p) => {
          const entry = minigame.simonEntries?.[p.id];
          return Boolean(entry && (entry.failed || entry.completedRounds >= MAX_ROUNDS));
        });

      if (remaining <= 0 || everyoneEnded) {
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
    }, 250);

    return () => {
      clearInterval(interval);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [
    minigame?.phase,
    minigame?.endsAt,
    minigame?.simonEntries,
    players,
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
            <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border-2 border-pink-400 flex items-center justify-center text-3xl mb-3 animate-bounce-subtle motion-reduce:animate-none">
              <span aria-hidden="true">🧠</span>
            </div>
            <span className="text-xs font-black text-pink-300 uppercase tracking-widest mb-1">
              Pipeline en Preparación
            </span>
            <h2 id={titleId} className="text-xl font-black text-white">
              ¡Prepara tu Memoria CI/CD!
            </h2>
            <p className="text-xs text-slate-300 mt-2 max-w-xs leading-relaxed">
              Observa las luces en tu Joy-Phone y repite el orden exacto de cada fase.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const currentRoundLength = Math.min(sequence.length, START_LENGTH + roundIdx);
  const myCompletedRounds = serverEntry?.completedRounds ?? roundIdx;

  const handlePadClick = (stepId: PipelineStepId) => {
    if (minigame.phase !== 'playing' || subPhase !== 'input' || timeLeft <= 0) return;

    const expectedStep = sequence[userInputIdx];
    const stepDef = PIPELINE_STEP_MAP[stepId];
    const elapsedMs = Math.round(performance.now() - playStartPerfRef.current);

    setLitStepId(stepId);
    setTimeout(() => {
      setLitStepId((curr) => (curr === stepId ? null : curr));
    }, 180);

    if (stepId !== expectedStep) {
      sounds.playSlip();
      setSubPhase('failed');
      submitSimonProgress(myPlayerId, myCompletedRounds, totalCorrect, true, elapsedMs);
      return;
    }

    sounds.playTone(stepDef.freq, 0.16);
    const nextCorrectTotal = totalCorrect + 1;
    const nextInputIdx = userInputIdx + 1;
    setTotalCorrect(nextCorrectTotal);
    setUserInputIdx(nextInputIdx);

    if (nextInputIdx >= currentRoundLength) {
      const nextRounds = roundIdx + 1;
      sounds.playCoin();
      submitSimonProgress(myPlayerId, nextRounds, nextCorrectTotal, false, elapsedMs);

      if (nextRounds >= MAX_ROUNDS || START_LENGTH + nextRounds > sequence.length) {
        setSubPhase('completed');
      } else {
        setSubPhase('round_clear');
        setTimeout(() => {
          setRoundIdx(nextRounds);
          setUserInputIdx(0);
          setSubPhase('watching');
        }, 450);
      }
    }
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
          <div className="text-xs font-game font-black uppercase tracking-widest text-pink-300 mb-1">
            MINIJUEGO DE MEMORIA • ¡PREMIO: +2 ESTRELLAS!
          </div>
          <h2 id={titleId} className="text-2xl md:text-4xl font-extrabold drop-shadow-md">
            <span aria-hidden="true" className="text-white mr-2">
              🧠
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-400 to-amber-300">
              SECUENCIA DE PIPELINE
            </span>
          </h2>

          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-pink-400/50 text-xs font-bold text-slate-100">
            <span aria-hidden="true">⏱️</span>
            <span>{timeLeft}s restantes</span>
            {isController && (
              <span>
                · Ronda {Math.min(MAX_ROUNDS, roundIdx + 1)}/{MAX_ROUNDS}
              </span>
            )}
          </div>
        </div>

        {isController ? (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Subphase Banner */}
            <div
              role="status"
              aria-live="polite"
              className={`w-full mb-4 px-4 py-2.5 rounded-2xl border text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                subPhase === 'watching'
                  ? 'bg-sky-500/20 border-sky-400/70 text-sky-200'
                  : subPhase === 'input'
                  ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-200'
                  : subPhase === 'round_clear'
                  ? 'bg-amber-500/20 border-yellow-400 text-yellow-200'
                  : subPhase === 'completed'
                  ? 'bg-amber-500/25 border-yellow-300 text-yellow-200'
                  : 'bg-rose-950/80 border-rose-400 text-rose-200'
              }`}
            >
              {subPhase === 'watching' && (
                <>
                  <span aria-hidden="true">👀</span>
                  <span>OBSERVA ({currentRoundLength} pasos)</span>
                </>
              )}
              {subPhase === 'input' && (
                <>
                  <span aria-hidden="true">👉</span>
                  <span>
                    ¡TU TURNO! Paso {userInputIdx + 1} de {currentRoundLength}
                  </span>
                </>
              )}
              {subPhase === 'round_clear' && (
                <>
                  <span aria-hidden="true">✅</span>
                  <span>¡RONDA SUPERADA!</span>
                </>
              )}
              {subPhase === 'completed' && (
                <>
                  <span aria-hidden="true">🏆</span>
                  <span>¡PIPELINE COMPLETADO AL 100%!</span>
                </>
              )}
              {subPhase === 'failed' && (
                <>
                  <span aria-hidden="true">💥</span>
                  <span>¡PIPELINE ROTO! Marca: {myCompletedRounds} rondas</span>
                </>
              )}
            </div>

            {subPhase === 'failed' || subPhase === 'completed' ? (
              <div
                role="status"
                aria-live="polite"
                className="w-full p-6 rounded-3xl bg-slate-900/95 border-2 border-white/15 text-center shadow-2xl"
              >
                {subPhase === 'completed' ? (
                  <Trophy className="w-12 h-12 text-yellow-300 mx-auto mb-2" aria-hidden="true" />
                ) : (
                  <Flame className="w-12 h-12 text-rose-400 mx-auto mb-2" aria-hidden="true" />
                )}
                <div className="text-lg font-black text-white">
                  {myCompletedRounds} {myCompletedRounds === 1 ? 'ronda superada' : 'rondas superadas'}
                </div>
                <div className="text-xs text-slate-300 font-bold mt-1">
                  {totalCorrect} pasos correctos · Esperando resultados ({timeLeft}s)
                </div>
              </div>
            ) : (
              /* 2x2 Tactile Simon Pads (keep focus on watching->input via aria-disabled) */
              <div className="w-full grid grid-cols-2 gap-3">
                {PIPELINE_STEPS.map((step) => {
                  const isLit = litStepId === step.id;
                  const canTap = subPhase === 'input' && timeLeft > 0;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      data-step-id={step.id}
                      data-lit={isLit ? 'true' : 'false'}
                      aria-label={`Paso ${step.label}`}
                      aria-disabled={!canTap}
                      onClick={() => handlePadClick(step.id)}
                      className={`min-h-[92px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-100 motion-reduce:transition-none motion-reduce:transform-none select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${
                        isLit
                          ? `${step.activeClass} ring-4 ring-white motion-reduce:scale-100`
                          : step.restingClass
                      } ${
                        canTap
                          ? 'cursor-pointer active:scale-95 motion-reduce:active:scale-100'
                          : 'cursor-not-allowed opacity-90'
                      }`}
                    >
                      <span className="text-3xl" aria-hidden="true">
                        {step.emoji}
                      </span>
                      <span className="text-xs font-black tracking-wider uppercase">
                        {step.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step Progress Dots (>= 3:1 UI contrast) */}
            {subPhase !== 'failed' && subPhase !== 'completed' && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5" aria-hidden="true">
                {Array.from({ length: currentRoundLength }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-colors motion-reduce:transition-none ${
                      idx < userInputIdx
                        ? 'bg-emerald-400'
                        : 'bg-slate-500 border border-slate-400/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Host Live Race Board */
          <div className="w-full bg-slate-900/90 border border-white/15 rounded-2xl p-5 shadow-2xl">
            {/* Pipeline Legend */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {PIPELINE_STEPS.map((step) => (
                <span
                  key={step.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${step.badgeClass}`}
                >
                  <span aria-hidden="true">{step.emoji}</span>
                  <span>{step.label}</span>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {players.map((player) => {
                const entry = minigame.simonEntries?.[player.id];
                const rounds = entry?.completedRounds || 0;
                const steps = entry?.correctSteps || 0;
                const isDone = rounds >= MAX_ROUNDS;
                const isFailed = Boolean(entry?.failed);
                const pct = Math.min(100, Math.round((rounds / MAX_ROUNDS) * 100));

                return (
                  <div
                    key={player.id}
                    className={`p-3 rounded-xl border transition-colors motion-reduce:transition-none ${
                      isDone
                        ? 'bg-amber-500/20 border-yellow-400/70'
                        : isFailed
                        ? 'bg-rose-950/60 border-rose-500/50'
                        : 'bg-slate-800/90 border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CharacterAvatar
                          characterId={player.characterId}
                          size="sm"
                          showBorder={false}
                        />
                        <span className="text-xs font-extrabold text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-yellow-300 shrink-0">
                        {rounds} {rounds === 1 ? 'ronda' : 'rondas'} · {steps}p
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-1.5">
                      <div
                        className={`h-full transition-all duration-300 motion-reduce:transition-none ${
                          isDone
                            ? 'bg-yellow-400'
                            : isFailed
                            ? 'bg-rose-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="text-xs font-bold flex items-center gap-1">
                      {isDone ? (
                        <span className="text-yellow-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> ¡Completado!
                        </span>
                      ) : isFailed ? (
                        <span className="text-rose-300 inline-flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" aria-hidden="true" /> Pipeline roto
                        </span>
                      ) : (
                        <span className="text-emerald-300 inline-flex items-center gap-1">
                          <span aria-hidden="true">🟢</span> En carrera
                        </span>
                      )}
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
